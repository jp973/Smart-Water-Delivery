import { Request, Response, NextFunction } from "express";
import { getMessagingService } from "../../../services/v1/message";
import { COLLECTIONS, CONSTANTS, USER_ROLES } from "../../../utils/v1/constants";
import { logger } from "../../../utils/v1/logger";
import { generateOtp } from "../../../utils/v1/helper";
import jwt from "jsonwebtoken";
import { config } from "../../../config/v1/config";

const adminAuthLogger = logger.child({ module: "adminAuth" });

export const sendAdminOTP = async (req: Request, res: Response, next: NextFunction) => {
    const txId: string = req.txnId || "";
    const requestPath = `${req.baseUrl || ""}${req.path || ""}`;
    const actionLogger = adminAuthLogger.child({ action: "sendAdminOTP", txId, requestPath });

    actionLogger.info("Processing admin OTP send request");

    try {
        const rawCountryCode = typeof req.body.countryCode === "string" ? req.body.countryCode.trim() : "";
        const rawPhone = typeof req.body.phone === "string" ? req.body.phone.trim() : "";

        const db = req.db;

        // Check if OTP was recently sent (cooldown period)
        const existingOtp = await db.models[COLLECTIONS.OTP].findOne({
            countryCode: rawCountryCode,
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
                countryCode: rawCountryCode,
                phone: rawPhone,
            });

            // Generate OTP
            const otpValue = config.ENVIRONMENT === "development" ? "1234" : generateOtp();

            // Create new OTP record
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
            actionLogger.info("Admin OTP sent successfully");
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

export const verifyAdminOTP = async (req: Request, res: Response, next: NextFunction) => {
    const txId: string = req.txnId || "";
    const requestPath = `${req.baseUrl || ""}${req.path || ""}`;
    const actionLogger = adminAuthLogger.child({ action: "verifyAdminOTP", txId, requestPath });

    actionLogger.info("Verifying admin OTP");

    try {
        const rawCountryCode = typeof req.body.countryCode === "string" ? req.body.countryCode.trim() : "";
        const rawPhone = typeof req.body.phone === "string" ? req.body.phone.trim() : "";
        const rawOtp = typeof req.body.otp === "string" ? req.body.otp.trim() : "";

        const db = req.db;

        // Find OTP document
        const otpDoc = await db.models[COLLECTIONS.OTP].findOne({
            countryCode: rawCountryCode,
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
                countryCode: rawCountryCode,
                phone: rawPhone,
            });

            // Check if admin exists
            let admin = await db.models[COLLECTIONS.ADMIN].findOne({
                countryCode: rawCountryCode,
                phone: rawPhone,
            });

            let isNewAdmin = false;

            // Create admin if doesn't exist (first-time login)
            if (!admin) {
                admin = await db.models[COLLECTIONS.ADMIN].create({
                    countryCode: rawCountryCode,
                    phone: rawPhone,
                    name: "", // Empty name, admin can update later
                });
                isNewAdmin = true;
                actionLogger.info("Created new admin account");
            }

            // Check if admin has completed profile (name is set)
            const profileCompleted = Boolean(admin.name && admin.name.trim());

            // Generate JWT tokens
            const accessToken = jwt.sign(
                {
                    id: admin._id,
                    role: USER_ROLES.ADMIN,
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
                    id: admin._id,
                    role: USER_ROLES.ADMIN,
                    phone: rawPhone,
                    countryCode: rawCountryCode,
                },
                jwtSecret,
                {
                    expiresIn: `${config.REFRESH_TOKEN_EXPIRY}d`,
                },
            );

            // Delete existing tokens for this admin
            await db.models[COLLECTIONS.ACCESS_TOKEN].deleteMany({
                userId: admin._id,
                role: USER_ROLES.ADMIN,
            });

            await db.models[COLLECTIONS.REFRESH_TOKEN].deleteMany({
                userId: admin._id,
                role: USER_ROLES.ADMIN,
            });

            // Create new access token record
            await db.models[COLLECTIONS.ACCESS_TOKEN].create({
                token: accessToken,
                userId: admin._id,
                role: USER_ROLES.ADMIN,
            });

            // Create new refresh token record
            await db.models[COLLECTIONS.REFRESH_TOKEN].create({
                token: refreshToken,
                userId: admin._id,
                role: USER_ROLES.ADMIN,
            });

            req.apiStatus = {
                isSuccess: true,
                message: "OTP verified successfully",
                status: 200,
                data: {
                    isVerified: true,
                    isNewAdmin: isNewAdmin || !profileCompleted,
                    profileCompleted: profileCompleted,
                    accessToken,
                    refreshToken,
                    expiryTime: new Date(Date.now() + config.ACCESS_TOKEN_EXPIRY * 60 * 1000),
                },
                toastMessage: "OTP verified",
            };
            actionLogger.info("Admin OTP verified successfully");
        } catch (error) {
            actionLogger.error({ err: error }, "Error in OTP verification process");
            throw error;
        }

        return next();
    } catch (error) {
        actionLogger.error({ err: error }, "Failed to verify admin OTP");
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

export const refreshAdminToken = async (req: Request, res: Response, next: NextFunction) => {
    const txId: string = req.txnId || "";
    const requestPath = `${req.baseUrl || ""}${req.path || ""}`;
    const actionLogger = adminAuthLogger.child({ action: "refreshAdminToken", txId, requestPath });

    actionLogger.info("Refreshing admin access token");

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

        // Verify token role matches admin role
        if (decodedToken.role !== USER_ROLES.ADMIN) {
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
            // Delete existing access tokens for this admin
            await db.models[COLLECTIONS.ACCESS_TOKEN].deleteMany({
                userId: tokenFromDb.userId,
                role: USER_ROLES.ADMIN,
            });

            // Get admin details
            const admin = await db.models[COLLECTIONS.ADMIN].findOne({ _id: tokenFromDb.userId });

            if (!admin) {
                actionLogger.warn("Admin not found for refresh token");
                req.apiStatus = {
                    isSuccess: false,
                    message: "Admin not found",
                    status: 404,
                    data: {},
                    toastMessage: "Admin not found",
                };
                return next();
            }

            // Generate new access token
            const accessToken = jwt.sign(
                {
                    id: tokenFromDb.userId,
                    role: USER_ROLES.ADMIN,
                    phone: admin.phone,
                    countryCode: admin.countryCode,
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
                role: USER_ROLES.ADMIN,
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
            actionLogger.info("Admin access token refreshed successfully");
        } catch (error) {
            actionLogger.error({ err: error }, "Error in token refresh process");
            throw error;
        }

        return next();
    } catch (error) {
        actionLogger.error({ err: error }, "Failed to refresh admin access token");
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

export const logout = async (req: Request, res: Response, next: NextFunction) => {
    const txId: string = req.txnId || "";
    const requestPath = `${req.baseUrl || ""}${req.path || ""}`;
    const actionLogger = adminAuthLogger.child({ action: "logout", txId, requestPath });

    actionLogger.info("Processing admin logout request");

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
            role: USER_ROLES.ADMIN,
        });

        await req.db.models[COLLECTIONS.REFRESH_TOKEN].deleteMany({
            userId,
            role: USER_ROLES.ADMIN,
        });

        req.apiStatus = {
            isSuccess: true,
            message: "success",
            status: 200,
            data: "Logged out successfully",
            toastMessage: "Logged out successfully",
        };
        actionLogger.info("Admin logged out successfully");
        return next();
    } catch (error) {
        actionLogger.error({ err: error }, "Failed to log out admin");
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

export const updateAdminProfile = async (req: Request, res: Response, next: NextFunction) => {
    const txId: string = req.txnId || "";
    const requestPath = `${req.baseUrl || ""}${req.path || ""}`;
    const actionLogger = adminAuthLogger.child({ action: "updateAdminProfile", txId, requestPath });

    actionLogger.info("Processing admin profile update request");

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
            actionLogger.warn("Profile update attempted without authenticated user");
            return next();
        }

        const rawName = typeof req.body.name === "string" ? req.body.name.trim() : "";

        const db = req.db;

        // Update admin profile
        const updatedAdmin = await db.models[COLLECTIONS.ADMIN].findByIdAndUpdate(
            userId,
            { name: rawName },
            { new: true },
        );

        if (!updatedAdmin) {
            req.apiStatus = {
                isSuccess: false,
                message: "Admin not found",
                status: 404,
                data: {},
                toastMessage: "Admin not found",
            };
            actionLogger.warn("Admin not found for profile update");
            return next();
        }

        req.apiStatus = {
            isSuccess: true,
            message: "success",
            status: 200,
            data: {
                name: updatedAdmin.name,
                phone: updatedAdmin.phone,
                countryCode: updatedAdmin.countryCode,
            },
            toastMessage: "Profile updated successfully",
        };
        actionLogger.info("Admin profile updated successfully");
        return next();
    } catch (error) {
        actionLogger.error({ err: error }, "Failed to update admin profile");
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

export const getAdminProfile = async (req: Request, res: Response, next: NextFunction) => {
    const txId: string = req.txnId || "";
    const userId = req.user?._id;
    const actionLogger = adminAuthLogger.child({ action: "getAdminProfile", txId, userId });

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

        const admin = await db.models[COLLECTIONS.ADMIN].findOne({
            _id: userId,
        }).lean();

        if (!admin) {
            req.apiStatus = {
                isSuccess: false,
                message: "Admin not found",
                status: 404,
                data: {},
                toastMessage: "Admin not found",
            };
            return next();
        }

        req.apiStatus = {
            isSuccess: true,
            message: "Profile fetched successfully",
            status: 200,
            data: admin,
            toastMessage: null,
        };

        actionLogger.info("Admin profile fetched successfully");
        return next();
    } catch (error) {
        actionLogger.error({ err: error }, "Failed to fetch admin profile");
        req.apiStatus = {
            isSuccess: false,
            message: "Failed to fetch admin profile",
            status: 500,
            data: {},
            toastMessage: "Failed to fetch admin profile",
        };
        return next();
    }
};
