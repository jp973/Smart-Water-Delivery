import { Request, Response, NextFunction } from "express";
import { COLLECTIONS, USER_ROLES } from "../../../utils/v1/constants";
import { logger } from "../../../utils/v1/logger";
import jwt from "jsonwebtoken";
import { config } from "../../../config/v1/config";
import bcrypt from "bcryptjs";

const adminAuthLogger = logger.child({ module: "adminAuth" });

const normalizeEmail = (value: unknown): string =>
    typeof value === "string" ? value.trim().toLowerCase() : "";

const normalizePassword = (value: unknown): string => (typeof value === "string" ? value : "");

const normalizeName = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

export const loginAdmin = async (req: Request, res: Response, next: NextFunction) => {
    const txId: string = req.txnId || "";
    const requestPath = `${req.baseUrl || ""}${req.path || ""}`;
    const actionLogger = adminAuthLogger.child({ action: "loginAdmin", txId, requestPath });

    actionLogger.info("Processing admin email/password login request");

    try {
        const email = normalizeEmail(req.body.email);
        const password = normalizePassword(req.body.password);

        if (!email || !password) {
            req.apiStatus = {
                isSuccess: false,
                message: "Email and password are required",
                status: 400,
                data: {},
                toastMessage: "Email and password are required",
            };
            actionLogger.warn("Missing email or password");
            return next();
        }

        const db = req.db;
        const admin = await db.models[COLLECTIONS.ADMIN].findOne({ email });

        if (!admin) {
            req.apiStatus = {
                isSuccess: false,
                message: "Invalid credentials",
                status: 401,
                data: {},
                toastMessage: "Invalid credentials",
            };
            actionLogger.warn("Admin not found for provided email");
            return next();
        }

        const passwordMatches = await bcrypt.compare(password, admin.password);
        if (!passwordMatches) {
            req.apiStatus = {
                isSuccess: false,
                message: "Invalid credentials",
                status: 401,
                data: {},
                toastMessage: "Invalid credentials",
            };
            actionLogger.warn("Invalid password for admin");
            return next();
        }

        const jwtSecret = config.JWT_SECRET_KEY;

        const accessToken = jwt.sign(
            {
                id: admin._id,
                role: USER_ROLES.ADMIN,
                email: admin.email,
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
                email: admin.email,
            },
            jwtSecret,
            {
                expiresIn: `${config.REFRESH_TOKEN_EXPIRY}d`,
            },
        );

        await db.models[COLLECTIONS.ACCESS_TOKEN].deleteMany({
            userId: admin._id,
            role: USER_ROLES.ADMIN,
        });

        await db.models[COLLECTIONS.REFRESH_TOKEN].deleteMany({
            userId: admin._id,
            role: USER_ROLES.ADMIN,
        });

        await db.models[COLLECTIONS.ACCESS_TOKEN].create({
            token: accessToken,
            userId: admin._id,
            role: USER_ROLES.ADMIN,
        });

        await db.models[COLLECTIONS.REFRESH_TOKEN].create({
            token: refreshToken,
            userId: admin._id,
            role: USER_ROLES.ADMIN,
        });

        const profileCompleted = Boolean(admin.name && admin.name.trim());

        req.apiStatus = {
            isSuccess: true,
            message: "Login successful",
            status: 200,
            data: {
                profileCompleted,
                accessToken,
                refreshToken,
                expiryTime: new Date(Date.now() + config.ACCESS_TOKEN_EXPIRY * 60 * 1000),
                email: admin.email,
                name: admin.name,
            },
            toastMessage: "Logged in successfully",
        };
        actionLogger.info("Admin login successful");
        return next();
    } catch (error) {
        actionLogger.error({ err: error }, "Failed to process admin login");
        req.apiStatus = {
            isSuccess: false,
            message: "Error logging in",
            status: 500,
            data: {},
            toastMessage: "Error logging in",
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

        let decodedToken: {
            id: string;
            role: string;
            email?: string;
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
            await db.models[COLLECTIONS.ACCESS_TOKEN].deleteMany({
                userId: tokenFromDb.userId,
                role: USER_ROLES.ADMIN,
            });

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

            const accessToken = jwt.sign(
                {
                    id: tokenFromDb.userId,
                    role: USER_ROLES.ADMIN,
                    email: admin.email,
                },
                jwtSecret,
                {
                    expiresIn: `${config.ACCESS_TOKEN_EXPIRY}m`,
                },
            );

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
                    email: admin.email,
                    name: admin.name,
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

        const rawName = normalizeName(req.body.name);

        const db = req.db;

        const updatedAdmin = await db.models[COLLECTIONS.ADMIN].findByIdAndUpdate(
            userId,
            { name: rawName },
            { new: true, projection: { password: 0 } },
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
                email: updatedAdmin.email,
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
        })
            .select("-password")
            .lean();

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
