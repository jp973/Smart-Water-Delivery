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
import { getStorageServices } from "../../../services/v1/storage";
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

export const generatePresignedPost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const txId: string = (req as RequestWithTxId).txnId || (req as RequestWithTxId).txId || "";
  const requestPath = req.baseUrl + req.path;
  const fileName = req.body.fileName;

  try {
    req.log.info(`Generating presigned post for fileName: ${fileName}`);
    // Validate fileName
    if (!fileName || typeof fileName !== "string" || fileName.trim() === "") {
      req.apiStatus = {
        isSuccess: false,
        status: 400,
        message: "fileName is required and must be a non-empty string",
        toastMessage: "fileName is required",
        error: ErrorCodes[1006],
      };
      next();
      return;
    }

    const functions = await getStorageServices();

    if (!functions || !functions.getPresignedPost) {
      req.apiStatus = {
        isSuccess: false,
        status: 500,
        message: "Failed to fetch storage service functions",
        toastMessage: "Failed to fetch storage service functions",
        error: ErrorCodes[1006],
      };
      next();
      return;
    }

    const signedPost = await functions.getPresignedPost(fileName);

    req.log.info(`Presigned post generated successfully for fileName: ${fileName}`);
    req.apiStatus = {
      isSuccess: true,
      status: 200,
      message: "Success",
      toastMessage: "Success",
      data: { signedPost },
    };
    next();
    return;
  } catch (error: unknown) {
    req.log.error(`Error generating signed POST :- txId:${txId} path:${requestPath} - ${error instanceof Error ? error.message : String(error)}`);
    // Check for connection errors
    let errorMessage = "Error generating signed POST";
    let status = 500;

    if (error && typeof error === "object") {
      const err = error as { code?: string; message?: string };

      // Check for connection refused errors (MinIO/S3 not running)
      if (err.code === "ECONNREFUSED") {
        errorMessage = "Unable to connect to storage service. Please ensure MinIO/S3 service is running.";
        status = 503; // Service Unavailable
      } else if (err.message) {
        errorMessage = err.message;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    req.apiStatus = {
      isSuccess: false,
      status: status,
      message: errorMessage,
      toastMessage: errorMessage,
      data: errorMessage,
      error: ErrorCodes[1007],
    };
    next();
    return;
  }
};

export const getSignedUrlController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const txId: string = (req as RequestWithTxId).txnId || (req as RequestWithTxId).txId || "";
  const requestPath = req.baseUrl + req.path;
  const fileName = req.body.fileName;

  try {
    req.log.info(`Generating signed URL for fileName: ${fileName}`);
    // Validate fileName
    if (!fileName || !Array.isArray(fileName) || fileName.length === 0) {
      req.apiStatus = {
        isSuccess: false,
        status: 400,
        message: "fileName is required and must be a non-empty array",
        toastMessage: "fileName is required and must be an array",
        error: ErrorCodes[1006],
      };
      next();
      return;
    }

    // Validate all items in array are strings
    if (!fileName.every((item: unknown) => typeof item === "string" && item.trim() !== "")) {
      req.apiStatus = {
        isSuccess: false,
        status: 400,
        message: "All fileName items must be non-empty strings",
        toastMessage: "Invalid fileName format",
        error: ErrorCodes[1006],
      };
      next();
      return;
    }

    const functions = await getStorageServices();

    if (!functions || !functions.getSignedUrl) {
      req.apiStatus = {
        isSuccess: false,
        status: 500,
        message: "Failed to fetch storage service functions",
        toastMessage: "Failed to fetch storage service functions",
        error: ErrorCodes[1006],
      };
      next();
      return;
    }

    const signedUrls = await Promise.all(
      fileName.map(async (key: string) => {
        // Clean the key (remove quotes if present)
        const cleanKey = key.replace(/["']/g, "");
        const keyExists = signedUrlCache.has(cleanKey);

        let signedLink: string;

        if (keyExists) {
          signedLink = signedUrlCache.get(cleanKey) || "";
        } else {
          signedLink = await functions.getSignedUrl(cleanKey);
          // Cache the signed URL
          signedUrlCache.set(cleanKey, signedLink);
        }

        if (signedLink && signedLink.length > 0) {
          return signedLink;
        } else {
          return null;
        }
      }),
    );

    // Filter out null values
    const validSignedLinks = signedUrls.filter((link): link is string => link !== null);

    req.log.info(`Signed URLs generated successfully for fileNames: ${fileName.join(", ")}`);
    req.apiStatus = {
      isSuccess: true,
      status: 200,
      message: "Success",
      toastMessage: "Success",
      data: { signedLink: validSignedLinks },
    };
    next();
    return;
  } catch (error: unknown) {
    req.log.error(`Error in getSignedUrlController :- txId:${txId} path:${requestPath} - ${error instanceof Error ? error.message : String(error)}`);

    const errorMessage = error instanceof Error ? error.message : "Error getting signed URLs";

    req.apiStatus = {
      isSuccess: false,
      status: 500,
      message: errorMessage,
      toastMessage: "Error getting signed URLs",
      data: errorMessage,
      error: ErrorCodes[1007],
    };
    next();
    return;
  }
};


export const getLocationData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const txId: string = (req as RequestWithTxId).txnId || (req as RequestWithTxId).txId || "";
  const requestPath = req.baseUrl + req.path;
  const { type, state } = req.body as {
    type?: string;
    state?: string;
  };


  try {
    req.log.info(`Fetching location data for type: ${type} and state: ${state}`);
    let result: { name?: string; }[] = [];

    switch (type) {
      case "state": {
        // Get all states in India
        const states = getAllStates();
        result = states.map((state) => ({
          name: state
        }));
        break;
      }

      case "district": {
        // Validate stateCode is provided
        if (!state || typeof state !== "string" || state.trim() === "") {
          req.apiStatus = {
            isSuccess: false,
            status: 400,
            message: "stateCode is required for type=district",
            toastMessage: "stateCode is required",
            error: ErrorCodes[1001],
          };
          next();
          return;
        }

        let districts

        try {
        } catch (pkgError) {
          req.log.error(`Error calling Districts.getAllDistrictsByStateCode: ${pkgError}`);
        }

        if (!districts || districts === 0) {
          districts = getDistrictsByState(state);
        }

        if (!districts || districts.length === 0) {
          req.apiStatus = {
            isSuccess: false,
            status: 404,
            message: `No districts found for state =${state}`,
            toastMessage: "No districts found",
            error: ErrorCodes[1002],
          };
          next();
          return;
        }

        result = districts.map((district) => ({
          name: district.toString(),
        }));
        break;
      }

      default:
        req.apiStatus = {
          isSuccess: false,
          status: 400,
          message: "Invalid type. Allowed values: state, district",
          toastMessage: "Invalid type parameter",
          error: ErrorCodes[1006],
        };
        next();
        return;
    }

    req.log.info(`Location data fetched successfully for type: ${type} and state: ${state}`);
    req.apiStatus = {
      isSuccess: true,
      status: 200,
      message: "Data fetched successfully",
      data: result,
      toastMessage: "Data fetched successfully",
    };
    next();
    return;
  } catch (error: unknown) {
    req.log.error(`Error in getLocationData: ${error} :- txId:${txId} path:${requestPath}`);

    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred while fetching location data";

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
    let mappedData: PincodeItem[] = rawData.map((item: any) => ({
      pincode: item.pincode.toString(),
      area: item.name,
      officeType: item.division || "N/A", // Mapping division to officeType as a fallback
      district: item.district,
      state: item.state,
      region: item.region,
    }));

    // Handle Search
    if (search && Array.isArray(search) && search.length > 0) {
      mappedData = mappedData.filter((item) => {
        return search.some((s: any) => {
          const term = s.term;
          const fields = s.fields;
          if (term && fields && Array.isArray(fields)) {
            const regex = new RegExp(
              `${s.startsWith ? "^" : ""}${term}${s.endsWith ? "$" : ""}`,
              "i"
            );
            return fields.some((field: string) => {
              const value = (item as any)[field];
              return value && regex.test(value.toString());
            });
          }
          return false;
        });
      });
    }

    const totalCount = mappedData.length;

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

