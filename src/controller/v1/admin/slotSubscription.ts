import { Request, Response, NextFunction } from "express";
import mongoose, { FilterQuery } from "mongoose";
import { COLLECTIONS, EXTRA_REQUEST_STATUS, SUBSCRIPTION_STATUS } from "../../../utils/v1/constants";
import { logger } from "../../../utils/v1/logger";
import { ISlot, ISlotSubscription, IUser } from "../../../utils/v1/customTypes";

const adminSlotSubLogger = logger.child({ module: "adminSlotSubscription" });

interface AggregatedExtraRequest extends Omit<ISlotSubscription, "customerId" | "slotId"> {
    customerId: Pick<IUser, "name" | "phone" | "countryCode" | "address"> & { _id: mongoose.Types.ObjectId };
    slotId: Omit<ISlot, "areaId"> & {
        areaId: {
            _id: mongoose.Types.ObjectId;
            name: string;
        };
    };
}

interface SearchCriteria {
    term: string;
    fields: string[];
    startsWith?: boolean;
    endsWith?: boolean;
}

interface ListOptions {
    page?: number;
    itemsPerPage?: number;
    sortBy?: string[];
    sortDesc?: boolean[];
}

interface AggregationFacetResult {
    metadata: { total: number }[];
    data: AggregatedExtraRequest[];
}

export const getPendingExtraRequests = async (req: Request, res: Response, next: NextFunction) => {
    const txId: string = req.txnId || "";
    const actionLogger = adminSlotSubLogger.child({ action: "getPendingExtraRequests", txId });

    try {
        const db = req.db;
        const { filters = {}, options = {}, search = [], project = {} } = req.body as {
            filters?: Record<string, unknown>;
            options?: ListOptions;
            search?: SearchCriteria[];
            project?: Record<string, number>;
        };

        const query: FilterQuery<ISlotSubscription> = {
            extraRequestStatus: EXTRA_REQUEST_STATUS.PENDING,
            isDeleted: false,
            ...filters,
        };

        // Handle Search
        const searchQueries: FilterQuery<AggregatedExtraRequest>[] = [];
        if (search && Array.isArray(search) && search.length > 0) {
            search.forEach((s: SearchCriteria) => {
                const term = s.term;
                const fields = s.fields;
                if (term && fields && Array.isArray(fields)) {
                    const regex = new RegExp(
                        `${s.startsWith ? "^" : ""}${term}${s.endsWith ? "$" : ""}`,
                        "i",
                    );
                    fields.forEach((field: string) => {
                        let mappedField = field;
                        // Map fields to joined structure if needed
                        if (["name", "phone", "countryCode"].includes(field)) mappedField = `customerId.${field}`;
                        if (field === "area") mappedField = "slotId.areaId.name";
                        if (field === "date") mappedField = "slotId.date";

                        searchQueries.push({ [mappedField]: regex } as FilterQuery<AggregatedExtraRequest>);
                    });
                }
            });
        }

        const page = options.page || 1;
        const limit = options.itemsPerPage || 10;
        const skip = (page - 1) * limit;

        const aggregationSort: Record<string, 1 | -1> = {};
        if (options.sortBy && Array.isArray(options.sortBy)) {
            options.sortBy.forEach((field: string, index: number) => {
                let sortField = field;
                if (field === "name") sortField = "customerId.name";
                if (field === "area") sortField = "slotId.areaId.name";
                if (field === "date") sortField = "slotId.date";
                aggregationSort[sortField] = options.sortDesc && options.sortDesc[index] ? -1 : 1;
            });
        } else {
            aggregationSort.createdAt = -1;
        }

        const pipeline: mongoose.PipelineStage[] = [
            { $match: query },
            {
                $lookup: {
                    from: COLLECTIONS.USER,
                    localField: "customerId",
                    foreignField: "_id",
                    as: "customerId"
                }
            },
            { $unwind: { path: "$customerId", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: COLLECTIONS.SLOT,
                    localField: "slotId",
                    foreignField: "_id",
                    as: "slotId"
                }
            },
            { $unwind: { path: "$slotId", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: COLLECTIONS.AREA,
                    localField: "slotId.areaId",
                    foreignField: "_id",
                    as: "slotId.areaId"
                }
            },
            { $unwind: { path: "$slotId.areaId", preserveNullAndEmptyArrays: true } }
        ];

        // Apply search queries after lookups since some search fields might be in joined collections
        if (searchQueries.length > 0) {
            pipeline.push({ $match: { $or: searchQueries } });
        }

        pipeline.push({
            $facet: {
                metadata: [{ $count: "total" }],
                data: [
                    { $sort: aggregationSort },
                    { $skip: skip },
                    { $limit: limit },
                    {
                        $project: {
                            "customerId.isEnabled": 0,
                            "customerId.isVerified": 0,
                            "customerId.isDeleted": 0,
                            "customerId.createdAt": 0,
                            "customerId.updatedAt": 0,
                            "slotId.areaId.isDeleted": 0,
                            "slotId.areaId.createdAt": 0,
                            "slotId.areaId.updatedAt": 0,
                            "slotId.isActive": 0,
                            "slotId.isDeleted": 0,
                            "slotId.createdAt": 0,
                            "slotId.updatedAt": 0,
                            isActive: 0,
                            isDeleted: 0,
                            createdAt: 0,
                            updatedAt: 0,
                            deliveredAt: 0,
                        }
                    }
                ]
            }
        });

        const aggregationResult = await db.models[COLLECTIONS.SLOT_SUBSCRIPTION].aggregate(pipeline) as AggregationFacetResult[];

        let tableData = aggregationResult[0].data || [];
        const totalCount = aggregationResult[0].metadata[0]?.total || 0;

        // Apply manual projection if provided
        if (project && Object.keys(project).length > 0) {
            tableData = tableData.map((item: AggregatedExtraRequest) => {
                const projectedItem: Partial<AggregatedExtraRequest> = {};
                (Object.keys(project) as (keyof AggregatedExtraRequest)[]).forEach((key) => {
                    if (project[key] && key in item) {
                        (projectedItem as any)[key] = item[key];
                    }
                });
                // Always include _id unless explicitly excluded
                if (project._id !== 0 && !projectedItem._id && item._id) {
                    projectedItem._id = item._id;
                }
                return projectedItem as AggregatedExtraRequest;
            });
        }

        req.apiStatus = {
            isSuccess: true,
            message: "Pending extra requests fetched successfully",
            status: 200,
            data: {
                totalCount,
                tableData,
            },
            toastMessage: null,
        };

        actionLogger.info({ count: tableData.length, totalCount }, "Pending extra requests fetched successfully");
        return next();
    } catch (error) {
        actionLogger.error({ err: error }, "Failed to fetch pending extra requests");
        req.apiStatus = {
            isSuccess: false,
            message: "Failed to fetch pending extra requests",
            status: 500,
            data: {},
            toastMessage: "Internal server error",
        };
        return next();
    }
};

export const updateExtraRequestStatus = async (req: Request, res: Response, next: NextFunction) => {
    const txId: string = req.txnId || "";
    const { id } = req.params;
    const { status } = req.body;
    const actionLogger = adminSlotSubLogger.child({ action: "updateExtraRequestStatus", txId, subscriptionId: id, status });

    try {
        const db = req.db;

        const updatedSubscription = await db.models[COLLECTIONS.SLOT_SUBSCRIPTION].findOneAndUpdate(
            { _id: id, isDeleted: false },
            { extraRequestStatus: status },
            { new: true }
        );

        if (!updatedSubscription) {
            req.apiStatus = {
                isSuccess: false,
                message: "Subscription not found",
                status: 404,
                data: {},
                toastMessage: "Subscription not found",
            };
            return next();
        }

        req.apiStatus = {
            isSuccess: true,
            message: `Extra request ${status.toLowerCase()} successfully`,
            status: 200,
            data: updatedSubscription,
            toastMessage: `Extra request ${status.toLowerCase()} successfully`,
        };

        actionLogger.info(`Extra request ${status} successfully`);
        return next();
    } catch (error) {
        actionLogger.error({ err: error }, "Failed to update extra request status");
        req.apiStatus = {
            isSuccess: false,
            message: "Failed to update extra request status",
            status: 500,
            data: {},
            toastMessage: "Internal server error",
        };
        return next();
    }
};

export const updateSubscriptionStatus = async (req: Request, res: Response, next: NextFunction) => {
    const txId: string = req.txnId || "";
    const { id } = req.params;
    const { status } = req.body;
    const actionLogger = adminSlotSubLogger.child({ action: "updateSubscriptionStatus", txId, subscriptionId: id, status });

    try {
        const db = req.db;

        const updateData: Partial<ISlotSubscription> = { status };
        if (status === SUBSCRIPTION_STATUS.DELIVERED) {
            updateData.deliveredAt = new Date();
        }

        const updatedSubscription = await db.models[COLLECTIONS.SLOT_SUBSCRIPTION].findOneAndUpdate(
            { _id: id, isDeleted: false },
            { $set: updateData },
            { new: true }
        );

        if (!updatedSubscription) {
            req.apiStatus = {
                isSuccess: false,
                message: "Subscription not found",
                status: 404,
                data: {},
                toastMessage: "Subscription not found",
            };
            return next();
        }

        req.apiStatus = {
            isSuccess: true,
            message: `Subscription status updated to ${status} successfully`,
            status: 200,
            data: updatedSubscription,
            toastMessage: `Status updated to ${status}`,
        };

        actionLogger.info(`Subscription status updated to ${status} successfully`);
        return next();
    } catch (error) {
        actionLogger.error({ err: error }, "Failed to update subscription status");
        req.apiStatus = {
            isSuccess: false,
            message: "Failed to update subscription status",
            status: 500,
            data: {},
            toastMessage: "Internal server error",
        };
        return next();
    }
};

export const getTodaySlots = async (req: Request, res: Response, next: NextFunction) => {
    const txId: string = req.txnId || "";
    const actionLogger = adminSlotSubLogger.child({ action: "getTodaySlots", txId });

    try {
        const db = req.db;
        const { filters = {}, options = {}, search = [], project = {} } = req.body;

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const query: FilterQuery<ISlot> = {
            date: { $gte: startOfDay, $lte: endOfDay },
            isDeleted: false,
            ...filters,
        };

        const page = options.page || 1;
        const limit = options.itemsPerPage || 10;
        const skip = (page - 1) * limit;

        const aggregationSort: Record<string, 1 | -1> = {};
        if (options.sortBy && Array.isArray(options.sortBy)) {
            options.sortBy.forEach((field: string, index: number) => {
                aggregationSort[field] = options.sortDesc && options.sortDesc[index] ? -1 : 1;
            });
        } else {
            aggregationSort.startTime = 1;
        }

        const pipeline: mongoose.PipelineStage[] = [
            { $match: query },
            {
                $lookup: {
                    from: COLLECTIONS.AREA,
                    localField: "areaId",
                    foreignField: "_id",
                    as: "area"
                }
            },
            { $unwind: { path: "$area", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: COLLECTIONS.SLOT_SUBSCRIPTION,
                    localField: "_id",
                    foreignField: "slotId",
                    as: "subscriptions"
                }
            },
            {
                $addFields: {
                    allotted: {
                        $size: {
                            $filter: {
                                input: "$subscriptions",
                                as: "sub",
                                cond: { $ne: ["$$sub.status", SUBSCRIPTION_STATUS.CANCELLED] }
                            }
                        }
                    },
                    customerBookedLiter: {
                        $sum: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: "$subscriptions",
                                        as: "sub",
                                        cond: { $ne: ["$$sub.status", SUBSCRIPTION_STATUS.CANCELLED] }
                                    }
                                },
                                as: "s",
                                in: {
                                    $add: [
                                        "$$s.quantity",
                                        {
                                            $cond: [
                                                { $eq: ["$$s.extraRequestStatus", EXTRA_REQUEST_STATUS.APPROVED] },
                                                "$$s.extraQuantity",
                                                0
                                            ]
                                        }
                                    ]
                                }
                            }
                        }
                    },
                    uniqueCustomers: {
                        $setUnion: [
                            {
                                $map: {
                                    input: {
                                        $filter: {
                                            input: "$subscriptions",
                                            as: "sub",
                                            cond: { $ne: ["$$sub.status", SUBSCRIPTION_STATUS.CANCELLED] }
                                        }
                                    },
                                    as: "s",
                                    in: "$$s.customerId"
                                }
                            },
                            []
                        ]
                    }
                }
            },
            {
                $addFields: {
                    progressPercentage: {
                        $cond: [
                            { $gt: ["$capacity", 0] },
                            {
                                $toString: {
                                    $floor: {
                                        $multiply: [
                                            { $divide: ["$customerBookedLiter", "$capacity"] },
                                            100
                                        ]
                                    }
                                }
                            },
                            "0"
                        ]
                    }
                }
            }
        ];

        // Handle Search
        if (search && Array.isArray(search) && search.length > 0) {
            const searchQueries: FilterQuery<any>[] = [];
            search.forEach((s: any) => {
                const regex = new RegExp(`${s.startsWith ? "^" : ""}${s.term}${s.endsWith ? "$" : ""}`, "i");
                s.fields.forEach((field: string) => {
                    let mappedField = field;
                    if (field === "area") mappedField = "area.name";
                    searchQueries.push({ [mappedField]: regex });
                });
            });
            if (searchQueries.length > 0) {
                pipeline.push({ $match: { $or: searchQueries } });
            }
        }

        const totalAggregation = await db.models[COLLECTIONS.SLOT].aggregate([
            ...pipeline,
            {
                $group: {
                    _id: null,
                    totalLiters: { $sum: "$customerBookedLiter" },
                    allTodayCustomers: { $push: "$uniqueCustomers" }
                }
            },
            {
                $project: {
                    totalLiters: 1,
                    totalCustomers: {
                        $size: {
                            $reduce: {
                                input: "$allTodayCustomers",
                                initialValue: [],
                                in: { $setUnion: ["$$value", "$$this"] }
                            }
                        }
                    }
                }
            }
        ]);

        const summary = totalAggregation[0] || { totalLiters: 0, totalCustomers: 0 };

        pipeline.push({
            $facet: {
                metadata: [{ $count: "total" }],
                data: [
                    { $sort: aggregationSort },
                    { $skip: skip },
                    { $limit: limit },
                    { $project: { subscriptions: 0, uniqueCustomers: 0 } }
                ]
            }
        });

        const aggregationResult = await db.models[COLLECTIONS.SLOT].aggregate(pipeline);

        const tableData = aggregationResult[0].data || [];
        const totalCount = aggregationResult[0].metadata[0]?.total || 0;

        req.apiStatus = {
            isSuccess: true,
            message: "Today's slots fetched successfully",
            status: 200,
            data: {
                totalCount,
                totalLitersToday: summary.totalLiters.toLocaleString(),
                totalCustomer: summary.totalCustomers.toString(),
                tableData,
            },
            toastMessage: null,
        };

        actionLogger.info({ count: tableData.length, totalCount }, "Today's slots fetched successfully");
        return next();
    } catch (error) {
        actionLogger.error({ err: error }, "Failed to fetch today's slots");
        req.apiStatus = {
            isSuccess: false,
            message: "Failed to fetch today's slots",
            status: 500,
            data: {},
            toastMessage: "Internal server error",
        };
        return next();
    }
};
