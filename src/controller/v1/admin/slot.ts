import { Request, Response, NextFunction } from "express";
import mongoose, { FilterQuery, SortOrder, Types } from "mongoose";
import { COLLECTIONS, EXTRA_REQUEST_STATUS, SLOT_STATUS, SUBSCRIPTION_STATUS } from "../../../utils/v1/constants";
import { logger } from "../../../utils/v1/logger";
import { ISlot, ISlotSubscription, IUser } from "../../../utils/v1/customTypes";

const slotLogger = logger.child({ module: "slot" });

interface SearchItem {
    term: string;
    fields: string[];
    startsWith?: boolean;
    endsWith?: boolean;
}

interface ListOptions {
    page?: number | string;
    itemsPerPage?: number | string;
    sortBy?: string[];
    sortDesc?: boolean[];
}

interface GetAllSlotRequestBody {
    filters?: Record<string, unknown>;
    options?: ListOptions;
    search?: SearchItem[];
    project?: Record<string, number | boolean>;
}

export const createSlot = async (req: Request, res: Response, next: NextFunction) => {
    const txId: string = req.txnId || "";
    const actionLogger = slotLogger.child({ action: "createSlot", txId });

    try {
        const { date, startTime, endTime, areaId, capacity, bookingCutoffTime } = req.body;
        const db = req.db;

        const newSlot = await db.models[COLLECTIONS.SLOT].create({
            date,
            startTime,
            endTime,
            areaId,
            capacity,
            bookingCutoffTime,
        });

        // Auto-subscribe users in the area
        const usersInArea = await db.models[COLLECTIONS.USER].find({
            "address.area": areaId,
            isDeleted: false,
            isEnabled: true,
        }).lean();

        if (usersInArea.length > 0) {
            const subscriptions: Partial<ISlotSubscription>[] = usersInArea.map((user: IUser & { _id: Types.ObjectId }) => ({
                customerId: user._id,
                slotId: newSlot._id,
                quantity: user.waterQuantity || 0,
            }));

            await db.models[COLLECTIONS.SLOT_SUBSCRIPTION].insertMany(subscriptions);
            actionLogger.info({ count: subscriptions.length }, "Auto-subscribed users to new slot");
        }

        req.apiStatus = {
            isSuccess: true,
            message: "Slot created successfully",
            status: 201,
            data: { _id: newSlot._id },
            toastMessage: "Slot created successfully",
        };

        actionLogger.info({ slotId: newSlot._id }, "Slot created successfully");
        return next();
    } catch (error) {
        actionLogger.error({ err: error }, "Failed to create slot");
        req.apiStatus = {
            isSuccess: false,
            message: "Failed to create slot",
            status: 500,
            data: {},
            toastMessage: "Failed to create slot",
        };
        return next();
    }
};

export const updateSlot = async (req: Request, res: Response, next: NextFunction) => {
    const txId: string = req.txnId || "";
    const { id } = req.params;
    const actionLogger = slotLogger.child({ action: "updateSlot", txId, slotId: id });

    try {
        const { date, startTime, endTime, areaId, capacity, status, isActive, bookingCutoffTime } = req.body;
        const db = req.db;

        const updatedSlot = await db.models[COLLECTIONS.SLOT].findByIdAndUpdate(
            id,
            { date, startTime, endTime, areaId, capacity, status, isActive, bookingCutoffTime },
            { new: true },
        );

        if (!updatedSlot) {
            req.apiStatus = {
                isSuccess: false,
                message: "Slot not found",
                status: 404,
                data: {},
                toastMessage: "Slot not found",
            };
            return next();
        }

        req.apiStatus = {
            isSuccess: true,
            message: "Slot updated successfully",
            status: 200,
            data: updatedSlot,
            toastMessage: "Slot updated successfully",
        };

        actionLogger.info("Slot updated successfully");
        return next();
    } catch (error) {
        actionLogger.error({ err: error }, "Failed to update slot");
        req.apiStatus = {
            isSuccess: false,
            message: "Failed to update slot",
            status: 500,
            data: {},
            toastMessage: "Failed to update slot",
        };
        return next();
    }
};

export const deleteSlot = async (req: Request, res: Response, next: NextFunction) => {
    const txId: string = req.txnId || "";
    const { id } = req.params;
    const actionLogger = slotLogger.child({ action: "deleteSlot", txId, slotId: id });

    try {
        const db = req.db;

        const deletedSlot = await db.models[COLLECTIONS.SLOT].findOneAndUpdate(
            { _id: id, isDeleted: false },
            { isDeleted: true },
            { new: true },
        );

        if (!deletedSlot) {
            req.apiStatus = {
                isSuccess: false,
                message: "Slot not found",
                status: 404,
                data: {},
                toastMessage: "Slot not found",
            };
            return next();
        }

        req.apiStatus = {
            isSuccess: true,
            message: "Slot deleted successfully",
            status: 200,
            data: null,
            toastMessage: "Slot deleted successfully",
        };

        actionLogger.info("Slot soft-deleted successfully");
        return next();
    } catch (error) {
        actionLogger.error({ err: error }, "Failed to delete slot");
        req.apiStatus = {
            isSuccess: false,
            message: "Failed to delete slot",
            status: 500,
            data: {},
            toastMessage: "Failed to delete slot",
        };
        return next();
    }
};

interface AggregatedSlot extends Omit<ISlot, "areaId"> {
    areaId: {
        _id: mongoose.Types.ObjectId;
        name: string;
        description: string;
        city: string;
        pincode: string;
    };
    debug_rawSubscriptionCount?: number;
}

export const getSlotById = async (req: Request, res: Response, next: NextFunction) => {
    const txId: string = req.txnId || "";
    const id = req.params.id as string;
    const actionLogger = slotLogger.child({ action: "getSlotById", txId, slotId: id });

    try {
        const db = req.db;

        const results = await db.models[COLLECTIONS.SLOT].aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(id), isDeleted: false } },
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
                    from: "slotsubscriptions",
                    localField: "_id",
                    foreignField: "slotId",
                    as: "subscriptions"
                }
            },
            {
                $addFields: {
                    debug_rawSubscriptionCount: { $size: "$subscriptions" },
                    currentBookingsCount: {
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
                    }
                }
            },
            {
                $addFields: {
                    status: {
                        $cond: [
                            { $eq: ["$status", SLOT_STATUS.CLOSED] },
                            SLOT_STATUS.CLOSED,
                            {
                                $cond: [
                                    { $gte: ["$currentBookingsCount", "$capacity"] },
                                    SLOT_STATUS.FULL,
                                    SLOT_STATUS.AVAILABLE
                                ]
                            }
                        ]
                    }
                }
            },
            { $project: { subscriptions: 0 } }
        ]) as AggregatedSlot[];

        const slot = results.length > 0 ? results[0] : null;

        if (!slot) {
            req.apiStatus = {
                isSuccess: false,
                message: "Slot not found",
                status: 404,
                data: {},
                toastMessage: "Slot not found",
            };
            return next();
        }

        req.apiStatus = {
            isSuccess: true,
            message: "Slot fetched successfully",
            status: 200,
            data: slot,
            toastMessage: null,
        };

        return next();
    } catch (error) {
        actionLogger.error({ err: error }, "Failed to fetch slot");
        req.apiStatus = {
            isSuccess: false,
            message: "Failed to fetch slot",
            status: 500,
            data: {},
            toastMessage: "Failed to fetch slot",
        };
        return next();
    }
};

export const getAllSlot = async (req: Request, res: Response, next: NextFunction) => {
    const txId: string = req.txnId || "";
    const actionLogger = slotLogger.child({ action: "getAllSlot", txId });

    try {
        const db = req.db;
        const { filters = {}, options = {}, search = [], project = {} }: GetAllSlotRequestBody = req.body;

        const query: FilterQuery<ISlot> = { isDeleted: false, ...filters };

        // Handle Search
        if (search && Array.isArray(search) && search.length > 0) {
            const searchQueries: FilterQuery<ISlot>[] = [];
            search.forEach((s) => {
                const term = s.term;
                const fields = s.fields;
                if (term && fields && Array.isArray(fields)) {
                    const regex = new RegExp(
                        `${s.startsWith ? "^" : ""}${term}${s.endsWith ? "$" : ""}`,
                        "i",
                    );
                    fields.forEach((field) => {
                        searchQueries.push({ [field]: regex } as FilterQuery<ISlot>);
                    });
                }
            });
            if (searchQueries.length > 0) {
                query.$or = searchQueries;
            }
        }

        actionLogger.info({ query }, "Fetching slots with query");

        // Handle Options
        const page = typeof options.page === 'string' ? parseInt(options.page) : (options.page || 1);
        const limit = typeof options.itemsPerPage === 'string' ? parseInt(options.itemsPerPage) : (options.itemsPerPage || 10);
        const skip = (page - 1) * limit;

        const aggregationSort: Record<string, 1 | -1> = {};
        if (options.sortBy && Array.isArray(options.sortBy)) {
            options.sortBy.forEach((field: string, index: number) => {
                aggregationSort[field] = options.sortDesc && options.sortDesc[index] ? -1 : 1;
            });
        } else {
            aggregationSort.createdAt = -1;
        }

        interface AggregationFacetResult {
            metadata: { total: number }[];
            data: AggregatedSlot[];
        }

        const aggregationResult = await db.models[COLLECTIONS.SLOT].aggregate([
            { $match: query },
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
                    from: "slotsubscriptions",
                    localField: "_id",
                    foreignField: "slotId",
                    as: "subscriptions"
                }
            },
            {
                $addFields: {
                    debug_rawSubscriptionCount: { $size: "$subscriptions" },
                    currentBookingsCount: {
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
                    }
                }
            },
            {
                $addFields: {
                    status: {
                        $cond: [
                            { $eq: ["$status", SLOT_STATUS.CLOSED] },
                            SLOT_STATUS.CLOSED,
                            {
                                $cond: [
                                    { $gte: ["$currentBookingsCount", "$capacity"] },
                                    SLOT_STATUS.FULL,
                                    SLOT_STATUS.AVAILABLE
                                ]
                            }
                        ]
                    }
                }
            },
            { $project: { subscriptions: 0 } },
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
        ]) as AggregationFacetResult[];

        const data: AggregatedSlot[] = aggregationResult[0].data || [];
        const totalCount: number = aggregationResult[0].metadata[0]?.total || 0;

        req.apiStatus = {
            isSuccess: true,
            message: "Slots fetched successfully",
            status: 200,
            data: {
                totalCount,
                tableData: data,
            },
            toastMessage: null,
        };

        return next();
    } catch (error) {
        actionLogger.error({ err: error, body: req.body }, "Failed to fetch slots");
        req.apiStatus = {
            isSuccess: false,
            message: "Failed to fetch slots",
            status: 500,
            data: {},
            toastMessage: "Failed to fetch slots",
        };
        return next();
    }
};
