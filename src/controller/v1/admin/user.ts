import { NextFunction, Request, Response } from "express";
import { FilterQuery, SortOrder, Types, PipelineStage } from "mongoose";
import { COLLECTIONS } from "../../../utils/v1/constants";
import { logger } from "../../../utils/v1/logger";
import { IUserModel, IUser, IArea } from "../../../utils/v1/customTypes";

const userLogger = logger.child({ module: "user" });

interface SearchItem {
    term: string;
    fields: string[];
    startsWith: boolean;
    endsWith: boolean;
}

interface GetAllOptions {
    page: number;
    itemsPerPage: number;
    sortBy: string[];
    sortDesc: boolean[];
}


interface AggregatedUser extends IUser {
    _id: Types.ObjectId;
    areaId?: IArea;
}

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
    const txId: string = req.txnId || "";
    const actionLogger = userLogger.child({ action: "createUser", txId });

    try {
        const { name, countryCode, phone, address, waterQuantity, notes } = req.body;
        const db = req.db;

        // Check for duplicate phone & countryCode
        const existingUser = await db.models[COLLECTIONS.USER].findOne({
            countryCode,
            phone,
            isDeleted: false,
        });

        if (existingUser) {
            req.apiStatus = {
                isSuccess: false,
                message: "User with this phone number already exists",
                status: 409,
                data: {},
                toastMessage: "User with this phone number already exists",
            };
            return next();
        }

        const newUser: IUserModel = new db.models[COLLECTIONS.USER]({
            name,
            countryCode,
            phone,
            address,
            waterQuantity,
            notes,
        });

        await newUser.save();

        req.apiStatus = {
            isSuccess: true,
            message: "User created successfully",
            status: 201,
            data: { _id: newUser._id },
            toastMessage: "User created successfully",
        };

        actionLogger.info({ userId: newUser._id }, "User created successfully");
        return next();
    } catch (error) {
        actionLogger.error({ err: error }, "Failed to create user");
        req.apiStatus = {
            isSuccess: false,
            message: "Failed to create user",
            status: 500,
            data: {},
            toastMessage: "Failed to create user",
        };
        return next();
    }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
    const txId: string = req.txnId || "";
    const { id } = req.params;
    const actionLogger = userLogger.child({ action: "updateUser", txId, userId: id });

    try {
        const db = req.db;
        const updateData = req.body;

        const updatedUser = await db.models[COLLECTIONS.USER].findOneAndUpdate(
            { _id: id, isDeleted: false },
            { $set: updateData },
            { new: true },
        );

        if (!updatedUser) {
            req.apiStatus = {
                isSuccess: false,
                message: "User not found",
                status: 404,
                data: {},
                toastMessage: "User not found",
            };
            return next();
        }

        req.apiStatus = {
            isSuccess: true,
            message: "User updated successfully",
            status: 200,
            data: updatedUser,
            toastMessage: "User updated successfully",
        };

        actionLogger.info("User updated successfully");
        return next();
    } catch (error) {
        actionLogger.error({ err: error }, "Failed to update user");
        req.apiStatus = {
            isSuccess: false,
            message: "Failed to update user",
            status: 500,
            data: {},
            toastMessage: "Failed to update user",
        };
        return next();
    }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    const txId: string = req.txnId || "";
    const { id } = req.params;
    const actionLogger = userLogger.child({ action: "deleteUser", txId, userId: id });

    try {
        const db = req.db;

        const deletedUser = await db.models[COLLECTIONS.USER].findOneAndUpdate(
            { _id: id, isDeleted: false },
            { $set: { isDeleted: true } },
            { new: true },
        );

        if (!deletedUser) {
            req.apiStatus = {
                isSuccess: false,
                message: "User not found",
                status: 404,
                data: {},
                toastMessage: "User not found",
            };
            return next();
        }

        req.apiStatus = {
            isSuccess: true,
            message: "User deleted successfully",
            status: 200,
            data: null,
            toastMessage: "User deleted successfully",
        };

        actionLogger.info("User soft-deleted successfully");
        return next();
    } catch (error) {
        actionLogger.error({ err: error }, "Failed to delete user");
        req.apiStatus = {
            isSuccess: false,
            message: "Failed to delete user",
            status: 500,
            data: {},
            toastMessage: "Failed to delete user",
        };
        return next();
    }
};

export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
    const txId: string = req.txnId || "";
    const id = req.params.id as string;
    const actionLogger = userLogger.child({ action: "getUserById", txId, userId: id });

    try {
        const db = req.db;

        const results = await db.models[COLLECTIONS.USER].aggregate([
            { $match: { _id: new Types.ObjectId(id), isDeleted: false } },
            {
                $lookup: {
                    from: COLLECTIONS.AREA,
                    localField: "address.area",
                    foreignField: "_id",
                    as: "areaId"
                }
            },
            { $unwind: { path: "$areaId", preserveNullAndEmptyArrays: true } }
        ]) as AggregatedUser[];

        const user = results.length > 0 ? results[0] : null;

        if (!user) {
            req.apiStatus = {
                isSuccess: false,
                message: "User not found",
                status: 404,
                data: {},
                toastMessage: "User not found",
            };
            return next();
        }

        req.apiStatus = {
            isSuccess: true,
            message: "User fetched successfully",
            status: 200,
            data: user,
            toastMessage: null,
        };

        actionLogger.info("User fetched successfully");
        return next();
    } catch (error) {
        actionLogger.error({ err: error }, "Failed to fetch user");
        req.apiStatus = {
            isSuccess: false,
            message: "Failed to fetch user",
            status: 500,
            data: {},
            toastMessage: "Failed to fetch user",
        };
        return next();
    }
};

interface AggregationFacetResult {
    metadata: { total: number }[];
    data: AggregatedUser[];
}

export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    const txId: string = req.txnId || "";
    const actionLogger = userLogger.child({ action: "getAllUsers", txId });

    try {
        const {
            options = {
                page: 1,
                itemsPerPage: 10,
                sortBy: ["createdAt"],
                sortDesc: [true],
            } as GetAllOptions,
            project = {},
            filters = {},
            search = [] as SearchItem[],
            areaId,
        } = req.body;

        const { page, itemsPerPage, sortBy, sortDesc } = options;
        const db = req.db;
        const skip = (Number(page) - 1) * Number(itemsPerPage);
        const limit = Number(itemsPerPage);

        // Map sorting arrays to aggregation sort object
        const aggregationSort: Record<string, 1 | -1> = {};
        if (sortBy && sortBy.length > 0) {
            sortBy.forEach((field: string, index: number) => {
                aggregationSort[field] = sortDesc[index] ? -1 : 1;
            });
        } else {
            aggregationSort.createdAt = -1;
        }

        const query: FilterQuery<IUserModel> = {
            isDeleted: false,
            ...filters,
        };

        if (areaId) {
            query["address.area"] = new Types.ObjectId(areaId as string);
        }

        const pipeline: PipelineStage[] = [
            { $match: query },
            {
                $lookup: {
                    from: COLLECTIONS.AREA,
                    localField: "address.area",
                    foreignField: "_id",
                    as: "areaId"
                }
            },
            { $unwind: { path: "$areaId", preserveNullAndEmptyArrays: true } }
        ];

        // Handle complex search array after lookup to support area fields
        if (search && search.length > 0) {
            const searchOrQueries: PipelineStage.Match["$match"][] = [];

            search.forEach((s: SearchItem) => {
                const { term, fields, startsWith, endsWith } = s;
                if (term && fields && fields.length > 0) {
                    let regexStr = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                    if (startsWith) regexStr = `^${regexStr}`;
                    if (endsWith) regexStr = `${regexStr}$`;
                    const regex = new RegExp(regexStr, "i");

                    fields.forEach((field: string) => {
                        if (field === "waterQuantity") {
                            // Support regex search on numeric waterQuantity
                            searchOrQueries.push({
                                $expr: {
                                    $regexMatch: {
                                        input: { $toString: "$waterQuantity" },
                                        regex: regexStr,
                                        options: "i"
                                    }
                                }
                            } as any); // Cast as any for complex $expr in match
                        } else {
                            searchOrQueries.push({ [field]: { $regex: regex } });
                        }
                    });
                }
            });

            if (searchOrQueries.length > 0) {
                pipeline.push({ $match: { $or: searchOrQueries } });
            }
        }

        // Apply projection if provided (root level only for now to match find behavior)
        if (project && Object.keys(project).length > 0) {
            pipeline.push({ $project: project });
        }

        pipeline.push({
            $facet: {
                metadata: [{ $count: "total" }],
                data: [
                    { $sort: aggregationSort },
                    { $skip: skip },
                    { $limit: limit }
                ]
            }
        });

        const aggregationResult = await db.models[COLLECTIONS.USER].aggregate(pipeline, {
            collation: { locale: "en", strength: 2 }
        }) as AggregationFacetResult[];

        const data = aggregationResult[0].data || [];
        const totalCount = aggregationResult[0].metadata[0]?.total || 0;

        req.apiStatus = {
            isSuccess: true,
            message: "Users fetched successfully",
            status: 200,
            data: {
                totalCount,
                tableData: data,
            },
            toastMessage: null,
        };

        actionLogger.info({ count: data.length, totalCount }, "Users fetched successfully");
        return next();
    } catch (error) {
        actionLogger.error({ err: error }, "Failed to fetch users");
        req.apiStatus = {
            isSuccess: false,
            message: "Failed to fetch users",
            status: 500,
            data: {},
            toastMessage: "Failed to fetch users",
        };
        return next();
    }
};
