import { Request, Response, NextFunction } from "express";
import { ErrorCodes } from "../../../db/dbTypes";
import {
  COLLECTIONS,
  USER_ROLES,
  CONSTANTS,
  SUBSCRIPTION_STATUS,
  SLOT_STATUS,
  EXTRA_REQUEST_STATUS,
  ENVIRONMENT
} from "../../../utils/v1/constants";
import { getAllStates, getDistrictsByState } from "india-states-districts";
const indianPincodes = require("indian-pincodes");

interface PincodeItem {
  pincode: string;
  area: string;
  officeType: string;
  deliveryStatus: string;
  district: string;
  state: string;
  region: string;
  circle: string;
}

interface RequestWithTxId extends Request {
  txnId?: string;
  txId?: string;
}

// Cache for signed URLs (in-memory cache)
const signedUrlCache = new Map<string, string>();

export const getAllConstants = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const txId: string = (req as RequestWithTxId).txnId || (req as RequestWithTxId).txId || "";
  const requestPath = req.baseUrl + req.path;

  try {
    req.log.info(`Fetching all constants`);
    const constants = {
      COLLECTIONS,
      USER_ROLES,
      CONSTANTS,
      SUBSCRIPTION_STATUS,
      SLOT_STATUS,
      EXTRA_REQUEST_STATUS,
      ENVIRONMENT
    };

    if (Object.keys(constants).length > 0) {
      req.log.info(`Constants fetched successfully`);
      req.apiStatus = {
        isSuccess: true,
        status: 200,
        message: "success",
        data: constants,
        toastMessage: "Data fetched successfully",
      };
      next();
      return;
    } else {
      req.apiStatus = {
        isSuccess: false,
        status: 404,
        error: ErrorCodes[1002],
        data: "Data not found",
        toastMessage: "Data not found",
      };
      next();
      return;
    }
  } catch (error: unknown) {
    req.log.error(`Error in getAllConstants: ${error} :- txId:${txId} path:${requestPath}`);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred. Please try again";

    req.apiStatus = {
      isSuccess: false,
      status: 500,
      data: errorMessage,
      error: ErrorCodes[1010],
      toastMessage: "An unexpected error occurred. Please try again",
    };
    next();
    return;
  }
};

export const getAllPincodes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const txId: string = (req as RequestWithTxId).txnId || (req as RequestWithTxId).txId || "";
  const requestPath = req.baseUrl + req.path;

  try {
    req.log.info(`Fetching Karnataka pincodes`);
    const { search = [], options = {} } = req.body;

    // Fetch Karnataka pincodes and map to requested structure
    const rawData = indianPincodes.getPincodesByState("Karnataka");
    let mappedData: PincodeItem[] = rawData.map((item: PincodeItem) => ({
      pincode: item.pincode.toString(),
      area: (item as unknown as Record<string, unknown>).name as string || item.area, // indianPincodes might use 'name' or 'area'
      officeType: (item as unknown as Record<string, unknown>).division as string || "N/A", // Mapping division to officeType as a fallback
      district: item.district,
      state: item.state,
      region: item.region,
    }));

    // Handle Search
    if (search && Array.isArray(search) && search.length > 0) {
      mappedData = mappedData.filter((item: PincodeItem) => {
        return search.some((s: { term: string; fields: string[]; startsWith?: boolean; endsWith?: boolean }) => {
          const term = s.term;
          const fields = s.fields;
          if (term && fields && Array.isArray(fields)) {
            const regex = new RegExp(
              `${s.startsWith ? "^" : ""}${term}${s.endsWith ? "$" : ""}`,
              "i"
            );
            return fields.some((field: string) => {
              const value = (item as unknown as Record<string, unknown>)[field];
              return value && regex.test(value.toString());
            });
          }
          return false;
        });
      });
    }

    const totalCount = mappedData.length;
    const { sortBy = [], sortDesc = [] } = options;

    // Handle Sorting
    if (sortBy && Array.isArray(sortBy) && sortBy.length > 0) {
      mappedData.sort((a, b) => {
        for (let i = 0; i < sortBy.length; i++) {
          const field = sortBy[i];
          const desc = sortDesc[i];
          const valA = (a as unknown as Record<string, unknown>)[field];
          const valB = (b as unknown as Record<string, unknown>)[field];

          if (valA === valB) continue;

          if (typeof valA === "string" && typeof valB === "string") {
            return desc
              ? valB.localeCompare(valA, "en", { sensitivity: "base" })
              : valA.localeCompare(valB, "en", { sensitivity: "base" });
          }

          if (typeof valA === "number" && typeof valB === "number") {
            return desc ? valB - valA : valA - valB;
          }

          return desc
            ? (String(valA) < String(valB) ? 1 : -1)
            : (String(valA) > String(valB) ? 1 : -1);
        }
        return 0;
      });
    }

    // Handle Pagination
    const page = typeof options.page === 'string' ? parseInt(options.page) : (options.page || 1);
    const limit = typeof options.itemsPerPage === 'string' ? parseInt(options.itemsPerPage) : (options.itemsPerPage || totalCount);
    const skip = (page - 1) * limit;

    const paginatedData = mappedData.slice(skip, skip + limit);

    req.log.info(`Karnataka pincodes fetched successfully. Count: ${totalCount}`);
    req.apiStatus = {
      isSuccess: true,
      status: 200,
      message: "success",
      data: {
        totalCount,
        tableData: paginatedData,
      },
      toastMessage: "Data fetched successfully",
    };
    next();
    return;
  } catch (error: unknown) {
    req.log.error(`Error in getAllPincodes: ${error} :- txId:${txId} path:${requestPath}`);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred while fetching pincode data";

    req.apiStatus = {
      isSuccess: false,
      status: 500,
      data: errorMessage,
      error: ErrorCodes[1010],
      toastMessage: "An unexpected error occurred. Please try again",
    };
    next();
    return;
  }
};

