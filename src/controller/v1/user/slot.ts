import { Request, Response, NextFunction } from "express";
import mongoose, { FilterQuery, SortOrder } from "mongoose";
import { COLLECTIONS, EXTRA_REQUEST_STATUS, SUBSCRIPTION_STATUS } from "../../../utils/v1/constants";
import { logger } from "../../../utils/v1/logger";
import { ISlot, ISlotSubscription } from "../../../utils/v1/customTypes";

const userSlotLogger = logger.child({ module: "userSlot" });

export const getCurrentSlot = async (req: Request, res: Response, next: NextFunction) => {
    const txId: string = req.txnId || "";
    const userId = req.user?._id;
    const actionLogger = userSlotLogger.child({ action: "getCurrentSlot", txId, userId });

    try {
        const db = req.db;
        const now = new Date();

        // 1. Get the user's areaId
        const user = await db.models[COLLECTIONS.USER].findOne({ _id: userId, isDeleted: false }, "address.area").lean();
        if (!user || !user.address?.area) {
            req.apiStatus = {
                isSuccess: false,
                message: "User area not found. Please update your profile.",
                status: 404,
                data: {},
                toastMessage: "Area not found in profile",
            };
            return next();
        }

        const areaId = user.address.area;

        // 2. Find upcoming slots in that area and check for user subscriptions
        const aggregationResult = await db.models[COLLECTIONS.SLOT].aggregate([
            {
                $match: {
                    areaId: new mongoose.Types.ObjectId(areaId as string),
                    endTime: { $gt: now },
                    isDeleted: false,
                    isActive: true,
                }
            },
            {
                $lookup: {
                    from: COLLECTIONS.AREA,
                    localField: "areaId",
                    foreignField: "_id",
                    as: "areaId"
                }
            },
            { $unwind: { path: "$areaId", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: COLLECTIONS.SLOT_SUBSCRIPTION,
                    localField: "_id",
                    foreignField: "slotId",
                    as: "allSubscriptions"
                }
            },
            {
                $addFields: {
                    currentBookingsCount: {
                        $sum: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: "$allSubscriptions",
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
                    }
                }
            },
            {
                $addFields: {
                    status: {
                        $cond: [
                            { $eq: ["$status", "Closed"] },
                            "Closed",
                            {
                                $cond: [
                                    { $gte: ["$currentBookingsCount", "$capacity"] },
                                    "Full",
                                    "Available"
                                ]
                            }
                        ]
                    }
                }
            },
            {
                $lookup: {
                    from: COLLECTIONS.SLOT_SUBSCRIPTION,
                    let: { slotId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$slotId", "$$slotId"] },
                                        { $eq: ["$customerId", new mongoose.Types.ObjectId(userId as string)] },
                                        { $ne: ["$status", SUBSCRIPTION_STATUS.CANCELLED] },
                                        { $eq: ["$isDeleted", false] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "userSubscription"
                }
            },
            { $project: { allSubscriptions: 0 } },
            { $sort: { startTime: 1 } }
        ]);

        if (aggregationResult.length === 0) {
            req.apiStatus = {
                isSuccess: true,
                message: "No upcoming slots found for your area",
                status: 200,
                data: null,
                toastMessage: null,
            };
            return next();
        }

        // 3. Find the first slot with a subscription
        const found = aggregationResult.find(item => item.userSubscription && item.userSubscription.length > 0);

        if (!found) {
            req.apiStatus = {
                isSuccess: true,
                message: "No active slot subscriptions found (slots might be cancelled)",
                status: 200,
                data: null,
                toastMessage: null,
            };
            return next();
        }

        const currentSlot = { ...found };
        const userSubscription = found.userSubscription[0];
        delete currentSlot.userSubscription;

        req.apiStatus = {
            isSuccess: true,
            message: "Current slot fetched successfully",
            status: 200,
            data: {
                slot: currentSlot,
                subscription: userSubscription,
            },
            toastMessage: null,
        };

        return next();
    } catch (error) {
        actionLogger.error({ err: error }, "Failed to fetch current slot");
        req.apiStatus = {
            isSuccess: false,
            message: "Failed to fetch current slot",
            status: 500,
            data: {},
            toastMessage: "Internal server error",
        };
        return next();
    }
};

export const cancelSlotSubscription = async (req: Request, res: Response, next: NextFunction) => {
    const txId: string = req.txnId || "";
    const userId = req.user?._id;
    const { id: subscriptionId } = req.params;
    const { status } = req.body;
    const actionLogger = userSlotLogger.child({ action: "cancelSlotSubscription", txId, userId, subscriptionId, status });

    try {
        const db = req.db;
        const now = new Date();

        const subscription = await db.models[COLLECTIONS.SLOT_SUBSCRIPTION].findOne({
            _id: subscriptionId,
            customerId: userId,
            isDeleted: false,
        }).populate('slotId').lean();

        if (!subscription) {
            req.apiStatus = {
                isSuccess: false,
                message: "Subscription not found",
                status: 404,
                data: {},
                toastMessage: "Subscription not found",
            };
            return next();
        }

        const slot = subscription.slotId as unknown as ISlot;
        if (now > new Date(slot.bookingCutoffTime)) {
            req.apiStatus = {
                isSuccess: false,
                message: "Cancellation period has ended for this slot.",
                status: 400,
                data: {},
                toastMessage: "Cancellation period expired",
            };
            return next();
        }

        await db.models[COLLECTIONS.SLOT_SUBSCRIPTION].findByIdAndUpdate(subscriptionId, {
            status: status
        });

        req.apiStatus = {
            isSuccess: true,
            message: "Subscription cancelled successfully",
            status: 200,
            data: {},
            toastMessage: "Subscription cancelled successfully",
        };

        actionLogger.info(`Subscription ${status.toLowerCase()} successfully`);
        return next();
    } catch (error) {
        actionLogger.error({ err: error }, "Failed to cancel subscription");
        req.apiStatus = {
            isSuccess: false,
            message: "Failed to cancel subscription",
            status: 500,
            data: {},
            toastMessage: "Internal server error",
        };
        return next();
    }
};

export const requestExtraQuantity = async (req: Request, res: Response, next: NextFunction) => {
    const txId: string = req.txnId || "";
    const userId = req.user?._id;
    const { id: subscriptionId } = req.params;
    const { quantity } = req.body;
    const actionLogger = userSlotLogger.child({ action: "requestExtraQuantity", txId, userId, subscriptionId });

    try {
        const db = req.db;

        const subscription = await db.models[COLLECTIONS.SLOT_SUBSCRIPTION].findOne({
            _id: subscriptionId,
            customerId: userId,
            isDeleted: false,
        });

        if (!subscription) {
            req.apiStatus = {
                isSuccess: false,
                message: "Subscription not found",
                status: 404,
                data: {},
                toastMessage: "Subscription not found",
            };
            return next();
        }

        subscription.extraQuantity = quantity;
        subscription.extraRequestStatus = EXTRA_REQUEST_STATUS.PENDING;
        await subscription.save();

        req.apiStatus = {
            isSuccess: true,
            message: "Extra quantity requested successfully",
            status: 200,
            data: {},
            toastMessage: "Extra request submitted for approval",
        };

        actionLogger.info({ quantity }, "Extra quantity requested successfully");
        return next();
    } catch (error) {
        actionLogger.error({ err: error }, "Failed to request extra quantity");
        req.apiStatus = {
            isSuccess: false,
            message: "Failed to request extra quantity",
            status: 500,
            data: {},
            toastMessage: "Internal server error",
        };
        return next();
    }
};

interface HistoryRecord {
    _id: mongoose.Types.ObjectId | string;
    date: Date | null;
    area: string;
    liters: string;
    status: SUBSCRIPTION_STATUS;
}

interface SearchCriteria {
    term: string;
    fields: string[];
    startsWith?: boolean;
    endsWith?: boolean;
}

export const getUserSlotHistory = async (req: Request, res: Response, next: NextFunction) => {
    const txId: string = req.txnId || "";
    const userId = req.user?._id;
    const actionLogger = userSlotLogger.child({ action: "getUserSlotHistory", txId, userId });

    try {
        actionLogger.info("Fetching user delivery history");
        const db = req.db;
        const { filters = {}, options = {}, search = [], project = {} } = req.body;

        const query: FilterQuery<ISlotSubscription> = {
            customerId: userId,
            isDeleted: false,
            ...filters,
        };

        // Handle Search
        if (search && Array.isArray(search) && search.length > 0) {
            const searchQueries: FilterQuery<ISlotSubscription>[] = [];
            search.forEach((s: SearchCriteria) => {
                const term = s.term;
                const fields = s.fields;
                if (term && fields && Array.isArray(fields)) {
                    const regex = new RegExp(
                        `${s.startsWith ? "^" : ""}${term}${s.endsWith ? "$" : ""}`,
                        "i",
                    );
                    fields.forEach((field: string) => {
                        searchQueries.push({ [field]: regex } as FilterQuery<ISlotSubscription>);
                    });
                }
            });
            if (searchQueries.length > 0) {
                query.$or = searchQueries;
            }
        }

        const page = options.page || 1;
        const limit = options.itemsPerPage || 10;
        const skip = (page - 1) * limit;

        // Map sort fields for aggregation
        const aggregationSort: Record<string, 1 | -1> = {};
        if (options.sortBy && Array.isArray(options.sortBy)) {
            options.sortBy.forEach((field: string, index: number) => {
                let sortField = field;
                if (field === "date") sortField = "slotId.date";
                if (field === "area") sortField = "slotId.areaId.name";
                aggregationSort[sortField] = options.sortDesc && options.sortDesc[index] ? -1 : 1;
            });
        } else {
            aggregationSort.createdAt = -1;
        }

        const aggregationResult = await db.models[COLLECTIONS.SLOT_SUBSCRIPTION].aggregate([
            { $match: query },
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
            { $unwind: { path: "$slotId.areaId", preserveNullAndEmptyArrays: true } },
            {
                $facet: {
                    metadata: [{ $count: "total" }],
                    data: [
                        { $sort: aggregationSort },
                        { $skip: skip },
                        { $limit: limit }
                    ]
                }
            }
        ]);

        const subscriptions = (aggregationResult[0].data || []) as (Omit<ISlotSubscription, "slotId"> & { slotId: Omit<ISlot, "areaId"> & { areaId: { name: string } } })[];
        const totalCount = aggregationResult[0].metadata[0]?.total || 0;

        // Transform data for the UI
        let tableData: HistoryRecord[] = subscriptions.map((sub) => {
            const slot = sub.slotId;
            const area = slot?.areaId;

            // Liters = quantity + (extraStatus === APPROVED ? extraQuantity : 0)
            const liters = (sub.quantity || 0) + (sub.extraRequestStatus === EXTRA_REQUEST_STATUS.APPROVED ? (sub.extraQuantity || 0) : 0);

            return {
                _id: sub._id,
                date: slot?.date || null,
                area: area?.name || "N/A",
                liters: `${liters}L`,
                status: sub.status,
            };
        });

        // Apply projection if provided in the request
        if (project && Object.keys(project).length > 0) {
            tableData = tableData.map((item) => {
                const projectedItem: Partial<HistoryRecord> = {};
                (Object.keys(project) as (keyof HistoryRecord)[]).forEach((recordKey) => {
                    if (project[recordKey] && recordKey in item) {
                        const value = item[recordKey];
                        // Using a safer assignment to avoid 'any'
                        Object.assign(projectedItem, { [recordKey]: value });
                    }
                });
                // If it's an inclusion projection, always include _id unless explicitly excluded
                if (project._id !== 0 && !projectedItem._id && item._id) {
                    projectedItem._id = item._id;
                }
                return projectedItem as HistoryRecord;
            });
        }

        req.apiStatus = {
            isSuccess: true,
            message: "User history fetched successfully",
            status: 200,
            data: {
                totalCount,
                tableData,
            },
            toastMessage: null,
        };

        actionLogger.info({ count: tableData.length, totalCount, tableData }, "User history fetched successfully");
        return next();
    } catch (error) {
        actionLogger.error({ err: error }, "Failed to fetch user history");
        req.apiStatus = {
            isSuccess: false,
            message: "Failed to fetch user history",
            status: 500,
            data: {},
            toastMessage: "Internal server error",
        };
        return next();
    }
};
