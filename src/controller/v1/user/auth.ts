import { Request, Response, NextFunction } from "express";
import { getMessagingService } from "../../../services/v1/message";
import { COLLECTIONS, CONSTANTS, USER_ROLES } from "../../../utils/v1/constants";
import { logger } from "../../../utils/v1/logger";
import { generateOtp } from "../../../utils/v1/helper";
import jwt from "jsonwebtoken";
import { config } from "../../../config/v1/config";
import mongoose, { Types } from "mongoose";
import { IArea, IUser } from "../../../utils/v1/customTypes";

const userAuthLogger = logger.child({ module: "userAuth" });

interface AggregatedUser extends IUser {
    _id: Types.ObjectId;
    areaId?: IArea;
}

export const sendUserOTP = async (req: Request, res: Response, next: NextFunction) => {
    const txId: string = req.txnId || "";
    const requestPath = `${req.baseUrl || ""}${req.path || ""}`;
    const actionLogger = userAuthLogger.child({ action: "sendUserOTP", txId, requestPath });

    actionLogger.info("Processing user OTP send request");

    try {
        const rawCountryCode = typeof req.body.countryCode === "string" ? req.body.countryCode.trim() : "";
        const rawPhone = typeof req.body.phone === "string" ? req.body.phone.trim() : "";

        const db = req.db;

        // Normalize country code for search
        const countryCodeWithPlus = rawCountryCode.startsWith("+") ? rawCountryCode : `+${rawCountryCode}`;
        const countryCodeWithoutPlus = rawCountryCode.startsWith("+") ? rawCountryCode.substring(1) : rawCountryCode;

        // Check if user exists and profile is completed
        const user = await db.models[COLLECTIONS.USER].findOne({
            countryCode: { $in: [countryCodeWithPlus, countryCodeWithoutPlus] },
            phone: rawPhone,
            isDeleted: false,
        });

        if (!user || !user.name) {
            req.apiStatus = {
                isSuccess: false,
                message: "User not registered",
                status: 404,
                data: {},
                toastMessage: "User not registered, please register first",
            };
            actionLogger.info(`User not found or profile incomplete for ${rawCountryCode}${rawPhone}`);
            return next();
        }

        // Check if OTP was recently sent (cooldown period)
        const existingOtp = await db.models[COLLECTIONS.OTP].findOne({
            countryCode: { $in: [countryCodeWithPlus, countryCodeWithoutPlus] },
            phone: rawPhone,
        });

        if (existingOtp?.createdAt) {
            const timeDiff = Math.abs(Date.now() - existingOtp.createdAt.getTime());
            const diffSeconds = Math.floor(timeDiff / 1000);
            if (diffSeconds < CONSTANTS.MIN_RESEND_INTERVAL_IN_SECONDS) {
                req.apiStatus = {
                    isSuccess: false,
                    message: "OTP already sent",
                    status: 400,
                    data: {},
                    toastMessage: "OTP already sent",
                };
                actionLogger.info("OTP already sent recently; blocking resend");
                return next();
            }
        }


        try {
            // Delete any existing OTPs for this phone number
            await db.models[COLLECTIONS.OTP].deleteMany({
                countryCode: { $in: [countryCodeWithPlus, countryCodeWithoutPlus] },
                phone: rawPhone,
            });

            // Generate OTP
            const otpValue = config.ENVIRONMENT === "development" ? "1234" : generateOtp();

            // Create new OTP record
            // Store with the format provided in the request to maintain consistency with verify process
            const otpDoc = await db.models[COLLECTIONS.OTP].create({
                countryCode: rawCountryCode,
                phone: rawPhone,
                otp: otpValue,
            });

            // Send OTP via messaging service
            const messagingServiceModule = await getMessagingService();
            await messagingServiceModule.sendOTP(rawPhone, rawCountryCode, otpDoc.otp ?? "");

            req.apiStatus = {
                isSuccess: true,
                message: "success",
                status: 200,
                data: "OTP sent successfully",
                toastMessage: "OTP sent",
            };
            actionLogger.info("User OTP sent successfully");
        } catch (error) {

            actionLogger.error({ err: error }, "Error in OTP send process");
            throw error;
        }


        return next();
    } catch (error) {
        actionLogger.error({ err: error }, "Failed to send admin OTP");
        req.apiStatus = {
            isSuccess: false,
            message: "Error sending OTP",
            status: 500,
            data: {},
            toastMessage: "Error sending OTP",
        };
        return next();
    }
};

export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
    const txId: string = req.txnId || "";
    const actionLogger = userAuthLogger.child({ action: "registerUser", txId });

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

        const newUser = new db.models[COLLECTIONS.USER]({
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

export const verifyUserOTP = async (req: Request, res: Response, next: NextFunction) => {
    const txId: string = req.txnId || "";
    const requestPath = `${req.baseUrl || ""}${req.path || ""}`;
    const actionLogger = userAuthLogger.child({ action: "verifyUserOTP", txId, requestPath });

    actionLogger.info("Verifying user OTP");

    try {
        const rawCountryCode = typeof req.body.countryCode === "string" ? req.body.countryCode.trim() : "";
        const rawPhone = typeof req.body.phone === "string" ? req.body.phone.trim() : "";
        const rawOtp = typeof req.body.otp === "string" ? req.body.otp.trim() : "";

        const db = req.db;

        // Find OTP document
        // Normalize country code for search
        const countryCodeWithPlus = rawCountryCode.startsWith("+") ? rawCountryCode : `+${rawCountryCode}`;
        const countryCodeWithoutPlus = rawCountryCode.startsWith("+") ? rawCountryCode.substring(1) : rawCountryCode;

        const otpDoc = await db.models[COLLECTIONS.OTP].findOne({
            countryCode: { $in: [countryCodeWithPlus, countryCodeWithoutPlus, rawCountryCode] },
            phone: rawPhone,
            otp: rawOtp,
        });

        if (!otpDoc) {
            req.apiStatus = {
                isSuccess: false,
                message: "Invalid OTP",
                status: 400,
                data: {},
                toastMessage: "Invalid OTP",
            };
            actionLogger.warn("Invalid OTP provided");
            return next();
        }

        const jwtSecret = config.JWT_SECRET_KEY;

        try {
            // Delete the used OTP
            await db.models[COLLECTIONS.OTP].deleteMany({
                countryCode: { $in: [countryCodeWithPlus, countryCodeWithoutPlus, rawCountryCode] },
                phone: rawPhone,
            });

            // Check if user exists
            const user = await db.models[COLLECTIONS.USER].findOne({
                countryCode: { $in: [countryCodeWithPlus, countryCodeWithoutPlus, rawCountryCode] },
                phone: rawPhone,
                isDeleted: false,
            });

            if (!user) {
                req.apiStatus = {
                    isSuccess: false,
                    message: "User not found",
                    status: 404,
                    data: {},
                    toastMessage: "User not found. Please register first.",
                };
                actionLogger.warn("User not found during OTP verification");
                return next();
            }

            // Generate JWT tokens
            const accessToken = jwt.sign(
                {
                    id: user._id,
                    role: USER_ROLES.USER,
                    phone: rawPhone,
                    countryCode: rawCountryCode,
                },
                jwtSecret,
                {
                    expiresIn: `${config.ACCESS_TOKEN_EXPIRY}m`,
                },
            );

            const refreshToken = jwt.sign(
                {
                    id: user._id,
                    role: USER_ROLES.USER,
                    phone: rawPhone,
                    countryCode: rawCountryCode,
                },
                jwtSecret,
                {
                    expiresIn: `${config.REFRESH_TOKEN_EXPIRY}d`,
                },
            );

            // Delete existing tokens for this user
            await db.models[COLLECTIONS.ACCESS_TOKEN].deleteMany({
                userId: user._id,
                role: USER_ROLES.USER,
            });

            await db.models[COLLECTIONS.REFRESH_TOKEN].deleteMany({
                userId: user._id,
                role: USER_ROLES.USER,
            });

            // Create new access token record
            await db.models[COLLECTIONS.ACCESS_TOKEN].create({
                token: accessToken,
                userId: user._id,
                role: USER_ROLES.USER,
            });

            // Create new refresh token record
            await db.models[COLLECTIONS.REFRESH_TOKEN].create({
                token: refreshToken,
                userId: user._id,
                role: USER_ROLES.USER,
            });

            req.apiStatus = {
                isSuccess: true,
                message: "OTP verified successfully",
                status: 200,
                data: {
                    isVerified: true,
                    accessToken,
                    refreshToken,
                    expiryTime: new Date(Date.now() + config.ACCESS_TOKEN_EXPIRY * 60 * 1000),
                },
                toastMessage: "OTP verified",
            };
            actionLogger.info("User OTP verified successfully");
        } catch (error) {
            actionLogger.error({ err: error }, "Error in OTP verification process");
            throw error;
        }

        return next();
    } catch (error) {
        actionLogger.error({ err: error }, "Failed to verify user OTP");
        req.apiStatus = {
            isSuccess: false,
            message: "Error verifying OTP",
            status: 500,
            data: {},
            toastMessage: "Error verifying OTP",
        };
        return next();
    }
};

export const refreshUserToken = async (req: Request, res: Response, next: NextFunction) => {
    const txId: string = req.txnId || "";
    const requestPath = `${req.baseUrl || ""}${req.path || ""}`;
    const actionLogger = userAuthLogger.child({ action: "refreshUserToken", txId, requestPath });

    actionLogger.info("Refreshing user access token");

    try {
        const rawRefreshToken = typeof req.body.refreshToken === "string" ? req.body.refreshToken.trim() : "";

        if (!rawRefreshToken) {
            req.apiStatus = {
                isSuccess: false,
                message: "Refresh token is required",
                status: 400,
                data: {},
                toastMessage: "Refresh token is required",
            };
            actionLogger.warn("Refresh token missing in request body");
            return next();
        }

        const db = req.db;
        const jwtSecret = config.JWT_SECRET_KEY;

        if (!jwtSecret) {
            actionLogger.error("JWT secret key is not configured");
            req.apiStatus = {
                isSuccess: false,
                message: "Error refreshing access token",
                status: 500,
                data: {},
                toastMessage: "Error refreshing access token",
            };
            return next();
        }

        // Verify JWT token signature and expiry
        let decodedToken: {
            id: string;
            role: string;
            phone?: string;
            countryCode?: string;
        };

        try {
            const verified = jwt.verify(rawRefreshToken, jwtSecret);
            decodedToken = verified as typeof decodedToken;
            actionLogger.info("JWT verification successful");
        } catch (jwtError: unknown) {
            let errorMessage = "Refresh token invalid or expired";

            if (jwtError instanceof Error) {
                errorMessage =
                    jwtError.name === "TokenExpiredError"
                        ? "Refresh token expired"
                        : jwtError.name === "JsonWebTokenError"
                            ? "Invalid refresh token"
                            : "Refresh token invalid or expired";
            }

            actionLogger.warn({ jwtError: jwtError instanceof Error ? jwtError.name : "UnknownError" }, "JWT verification failed");

            req.apiStatus = {
                isSuccess: false,
                message: errorMessage,
                status: 400,
                data: {},
                toastMessage: errorMessage,
            };
            return next();
        }

        // Verify token role matches user role
        if (decodedToken.role !== USER_ROLES.USER) {
            actionLogger.warn("Refresh token role mismatch");
            req.apiStatus = {
                isSuccess: false,
                message: "Refresh token invalid or expired",
                status: 400,
                data: {},
                toastMessage: "Refresh token invalid or expired",
            };
            return next();
        }

        // Check if token exists in database
        const tokenFromDb = await db.models[COLLECTIONS.REFRESH_TOKEN].findOne({
            token: rawRefreshToken,
            role: USER_ROLES.USER,
        });

        if (!tokenFromDb) {
            req.apiStatus = {
                isSuccess: false,
                message: "Refresh token invalid or expired",
                status: 400,
                data: {},
                toastMessage: "Refresh token invalid or expired",
            };
            actionLogger.warn("Refresh token not found in database");
            return next();
        }

        // Verify userId from JWT matches userId in database
        const jwtUserId = decodedToken.id?.toString();
        const dbUserId = tokenFromDb.userId?.toString();

        if (jwtUserId !== dbUserId) {
            actionLogger.warn("Refresh token userId mismatch between JWT and database");
            req.apiStatus = {
                isSuccess: false,
                message: "Refresh token invalid or expired",
                status: 400,
                data: {},
                toastMessage: "Refresh token invalid or expired",
            };
            return next();
        }

        try {
            // Delete existing access tokens for this user
            await db.models[COLLECTIONS.ACCESS_TOKEN].deleteMany({
                userId: tokenFromDb.userId,
                role: USER_ROLES.USER,
            });

            // Get user details
            const user = await db.models[COLLECTIONS.USER].findOne({ _id: tokenFromDb.userId });

            if (!user) {
                actionLogger.warn("User not found for refresh token");
                req.apiStatus = {
                    isSuccess: false,
                    message: "User not found",
                    status: 404,
                    data: {},
                    toastMessage: "User not found",
                };
                return next();
            }

            // Generate new access token
            const accessToken = jwt.sign(
                {
                    id: tokenFromDb.userId,
                    role: USER_ROLES.USER,
                    phone: user.phone,
                    countryCode: user.countryCode,
                },
                jwtSecret,
                {
                    expiresIn: `${config.ACCESS_TOKEN_EXPIRY}m`,
                },
            );

            // Create new access token record
            await db.models[COLLECTIONS.ACCESS_TOKEN].create({
                token: accessToken,
                userId: tokenFromDb.userId,
                role: USER_ROLES.USER,
            });

            req.apiStatus = {
                isSuccess: true,
                message: "success",
                status: 200,
                data: {
                    accessToken,
                    refreshToken: rawRefreshToken,
                    expiryTime: new Date(Date.now() + config.ACCESS_TOKEN_EXPIRY * 60 * 1000),
                },
                toastMessage: "Token refreshed",
            };
            actionLogger.info("User access token refreshed successfully");
        } catch (error) {
            actionLogger.error({ err: error }, "Error in token refresh process");
            throw error;
        }

        return next();
    } catch (error) {
        actionLogger.error({ err: error }, "Failed to refresh user access token");
        req.apiStatus = {
            isSuccess: false,
            message: "Error refreshing access token",
            status: 500,
            data: {},
            toastMessage: "Error refreshing access token",
        };
        return next();
    }
};

export const logoutUser = async (req: Request, res: Response, next: NextFunction) => {
    const txId: string = req.txnId || "";
    const requestPath = `${req.baseUrl || ""}${req.path || ""}`;
    const actionLogger = userAuthLogger.child({ action: "logoutUser", txId, requestPath });

    actionLogger.info("Processing user logout request");

    try {
        const userId = req.user?._id;

        if (!userId) {
            req.apiStatus = {
                isSuccess: false,
                message: "Unauthorized access. Please login again.",
                status: 401,
                data: {},
                toastMessage: "Unauthorized access. Please login again.",
            };
            actionLogger.warn("Logout attempted without authenticated user");
            return next();
        }

        await req.db.models[COLLECTIONS.ACCESS_TOKEN].deleteMany({
            userId,
            role: USER_ROLES.USER,
        });

        await req.db.models[COLLECTIONS.REFRESH_TOKEN].deleteMany({
            userId,
            role: USER_ROLES.USER,
        });

        req.apiStatus = {
            isSuccess: true,
            message: "success",
            status: 200,
            data: "Logged out successfully",
            toastMessage: "Logged out successfully",
        };
        actionLogger.info("User logged out successfully");
        return next();
    } catch (error) {
        actionLogger.error({ err: error }, "Failed to log out user");
        req.apiStatus = {
            isSuccess: false,
            message: "Something went wrong. Please try again later.",
            status: 500,
            data: {},
            toastMessage: "Something went wrong. Please try again later.",
        };
        return next();
    }
};

export const updateUserProfile = async (req: Request, res: Response, next: NextFunction) => {
    const txId: string = req.txnId || "";
    const userId = req.user?._id;
    const actionLogger = userAuthLogger.child({ action: "updateUserProfile", txId, userId });

    try {
        const db = req.db;
        const updateData = req.body;

        if (!userId) {
            req.apiStatus = {
                isSuccess: false,
                message: "Unauthorized",
                status: 401,
                data: {},
                toastMessage: "Unauthorized",
            };
            return next();
        }

        const updatedUser = await db.models[COLLECTIONS.USER].findOneAndUpdate(
            { _id: userId, isDeleted: false },
            { $set: updateData },
            { new: true },
        ).lean();

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

        // Fetch fully aggregated user data
        const results = await db.models[COLLECTIONS.USER].aggregate([
            { $match: { _id: new Types.ObjectId(userId as string), isDeleted: false } },
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

        const finalUser = results.length > 0 ? results[0] : null;

        req.apiStatus = {
            isSuccess: true,
            message: "Profile updated successfully",
            status: 200,
            data: finalUser,
            toastMessage: "Profile updated successfully",
        };

        actionLogger.info("User profile updated successfully");
        return next();
    } catch (error) {
        actionLogger.error({ err: error }, "Failed to update user profile");
        req.apiStatus = {
            isSuccess: false,
            message: "Failed to update user profile",
            status: 500,
            data: {},
            toastMessage: "Failed to update user profile",
        };
        return next();
    }
};

export const getUserProfile = async (req: Request, res: Response, next: NextFunction) => {
    const txId: string = req.txnId || "";
    const userId = req.user?._id;
    const actionLogger = userAuthLogger.child({ action: "getUserProfile", txId, userId });

    try {
        const db = req.db;

        if (!userId) {
            req.apiStatus = {
                isSuccess: false,
                message: "Unauthorized",
                status: 401,
                data: {},
                toastMessage: "Unauthorized",
            };
            return next();
        }

        const results = await db.models[COLLECTIONS.USER].aggregate([
            { $match: { _id: new Types.ObjectId(userId as string), isDeleted: false } },
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
            message: "Profile fetched successfully",
            status: 200,
            data: user,
            toastMessage: null,
        };

        actionLogger.info("User profile fetched successfully");
        return next();
    } catch (error) {
        actionLogger.error({ err: error }, "Failed to fetch user profile");
        req.apiStatus = {
            isSuccess: false,
            message: "Failed to fetch user profile",
            status: 500,
            data: {},
            toastMessage: "Failed to fetch user profile",
        };
        return next();
    }
};