import { Request, Response, NextFunction } from "express";
import { FilterQuery, SortOrder } from "mongoose";
import { COLLECTIONS } from "../../../utils/v1/constants";
import { logger } from "../../../utils/v1/logger";
import { IArea } from "../../../utils/v1/customTypes";

const areaLogger = logger.child({ module: "area" });

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

interface GetAllAreaRequestBody {
    filters?: Record<string, unknown>;
    options?: ListOptions;
    search?: SearchItem[];
    project?: Record<string, number | boolean>;
}

export const createArea = async (req: Request, res: Response, next: NextFunction) => {
    const txId: string = req.txnId || "";
    const actionLogger = areaLogger.child({ action: "createArea", txId });

    try {
        const { name, description, city, pincode } = req.body;
        const db = req.db;

        const newArea = await db.models[COLLECTIONS.AREA].create({
            name,
            description,
            city,
            pincode,
        });

        req.apiStatus = {
            isSuccess: true,
            message: "Area created successfully",
            status: 201,
            data: { _id: newArea._id },
            toastMessage: "Area created successfully",
        };

        actionLogger.info({ areaId: newArea._id }, "Area created successfully");
        return next();
    } catch (error) {
        actionLogger.error({ err: error }, "Failed to create area");
        req.apiStatus = {
            isSuccess: false,
            message: "Failed to create area",
            status: 500,
            data: {},
            toastMessage: "Failed to create area",
        };
        return next();
    }
};

export const updateArea = async (req: Request, res: Response, next: NextFunction) => {
    const txId: string = req.txnId || "";
    const { id } = req.params;
    const actionLogger = areaLogger.child({ action: "updateArea", txId, areaId: id });

    try {
        const { name, description, city, pincode } = req.body;
        const db = req.db;

        const updatedArea = await db.models[COLLECTIONS.AREA].findByIdAndUpdate(
            id,
            { name, description, city, pincode },
            { new: true },
        );

        if (!updatedArea) {
            req.apiStatus = {
                isSuccess: false,
                message: "Area not found",
                status: 404,
                data: {},
                toastMessage: "Area not found",
            };
            return next();
        }

        req.apiStatus = {
            isSuccess: true,
            message: "Area updated successfully",
            status: 200,
            data: updatedArea,
            toastMessage: "Area updated successfully",
        };

        actionLogger.info("Area updated successfully");
        return next();
    } catch (error) {
        actionLogger.error({ err: error }, "Failed to update area");
        req.apiStatus = {
            isSuccess: false,
            message: "Failed to update area",
            status: 500,
            data: {},
            toastMessage: "Failed to update area",
        };
        return next();
    }
};

export const deleteArea = async (req: Request, res: Response, next: NextFunction) => {
    const txId: string = req.txnId || "";
    const { id } = req.params;
    const actionLogger = areaLogger.child({ action: "deleteArea", txId, areaId: id });

    try {
        const db = req.db;

        const deletedArea = await db.models[COLLECTIONS.AREA].findOneAndUpdate(
            { _id: id, isDeleted: false },
            { isDeleted: true },
            { new: true },
        );

        if (!deletedArea) {
            req.apiStatus = {
                isSuccess: false,
                message: "Area not found",
                status: 404,
                data: {},
                toastMessage: "Area not found",
            };
            return next();
        }

        req.apiStatus = {
            isSuccess: true,
            message: "Area deleted successfully",
            status: 200,
            data: null,
            toastMessage: "Area deleted successfully",
        };

        actionLogger.info("Area soft-deleted successfully");
        return next();
    } catch (error) {
        actionLogger.error({ err: error }, "Failed to delete area");
        req.apiStatus = {
            isSuccess: false,
            message: "Failed to delete area",
            status: 500,
            data: {},
            toastMessage: "Failed to delete area",
        };
        return next();
    }
};

export const getAreaById = async (req: Request, res: Response, next: NextFunction) => {
    const txId: string = req.txnId || "";
    const { id } = req.params;
    const actionLogger = areaLogger.child({ action: "getAreaById", txId, areaId: id });

    try {
        const db = req.db;

        const area = await db.models[COLLECTIONS.AREA].findOne({ _id: id, isDeleted: false });

        if (!area) {
            req.apiStatus = {
                isSuccess: false,
                message: "Area not found",
                status: 404,
                data: {},
                toastMessage: "Area not found",
            };
            return next();
        }

        req.apiStatus = {
            isSuccess: true,
            message: "Area fetched successfully",
            status: 200,
            data: area,
            toastMessage: null,
        };

        return next();
    } catch (error) {
        actionLogger.error({ err: error }, "Failed to fetch area");
        req.apiStatus = {
            isSuccess: false,
            message: "Failed to fetch area",
            status: 500,
            data: {},
            toastMessage: "Failed to fetch area",
        };
        return next();
    }
};

export const getAllArea = async (req: Request, res: Response, next: NextFunction) => {
    const txId: string = req.txnId || "";
    const actionLogger = areaLogger.child({ action: "getAllArea", txId });

    try {
        const db = req.db;
        const { filters = {}, options = {}, search = [], project = {} }: GetAllAreaRequestBody = req.body;

        const query: FilterQuery<IArea> = { isDeleted: false, ...filters };

        // Handle Search
        if (search && Array.isArray(search) && search.length > 0) {
            const searchQueries: FilterQuery<IArea>[] = [];
            search.forEach((s) => {
                const term = s.term;
                const fields = s.fields;
                if (term && fields && Array.isArray(fields)) {
                    const regex = new RegExp(
                        `${s.startsWith ? "^" : ""}${term}${s.endsWith ? "$" : ""}`,
                        "i",
                    );
                    fields.forEach((field) => {
                        searchQueries.push({ [field]: regex } as FilterQuery<IArea>);
                    });
                }
            });
            if (searchQueries.length > 0) {
                query.$or = searchQueries;
            }
        }

        // Handle Options
        const page = typeof options.page === 'string' ? parseInt(options.page) : (options.page || 1);
        const limit = typeof options.itemsPerPage === 'string' ? parseInt(options.itemsPerPage) : (options.itemsPerPage || 10);
        const skip = (page - 1) * limit;

        const sort: { [key: string]: SortOrder } = {};
        if (options.sortBy && Array.isArray(options.sortBy)) {
            options.sortBy.forEach((field: string, index: number) => {
                sort[field] = options.sortDesc && options.sortDesc[index] ? -1 : 1;
            });
        } else {
            sort.createdAt = -1;
        }

        const data = await db.models[COLLECTIONS.AREA].find(query, project)
            .sort(sort)
            .skip(skip)
            .limit(limit);

        const totalCount = await db.models[COLLECTIONS.AREA].countDocuments(query);

        req.apiStatus = {
            isSuccess: true,
            message: "Areas fetched successfully",
            status: 200,
            data: {
                totalCount,
                tableData: data,
            },
            toastMessage: null,
        };

        return next();
    } catch (error) {
        actionLogger.error({ err: error }, "Failed to fetch areas");
        req.apiStatus = {
            isSuccess: false,
            message: "Failed to fetch areas",
            status: 500,
            data: {},
            toastMessage: "Failed to fetch areas",
        };
        return next();
    }
};

