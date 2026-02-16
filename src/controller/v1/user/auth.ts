import { Request, Response, NextFunction } from "express";
import { COLLECTIONS, USER_ROLES } from "../../../utils/v1/constants";
import { logger } from "../../../utils/v1/logger";
import jwt from "jsonwebtoken";
import { config } from "../../../config/v1/config";
import bcrypt from "bcryptjs";
import { generateOtp } from "../../../utils/v1/helper";
import { sendEmail } from "../../../services/v1/email";

const userAuthLogger = logger.child({ module: "userAuth" });

const normalizeEmail = (value: unknown): string =>
    typeof value === "string" ? value.trim().toLowerCase() : "";
const normalizePassword = (value: unknown): string => (typeof value === "string" ? value : "");
const normalizeName = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

const buildTokens = (payload: object) => {
    const accessToken = jwt.sign(payload, config.JWT_SECRET_KEY, {
        expiresIn: `${config.ACCESS_TOKEN_EXPIRY}m`,
    });
    const refreshToken = jwt.sign(payload, config.JWT_SECRET_KEY, {
        expiresIn: `${config.REFRESH_TOKEN_EXPIRY}d`,
    });
    return { accessToken, refreshToken };
};

export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
    const txId: string = req.txnId || "";
    const actionLogger = userAuthLogger.child({ action: "registerUser", txId });

    try {
        const { name, email, password, countryCode, phone, address, waterQuantity, notes } = req.body;
        const db = req.db;

        const normalizedEmail = normalizeEmail(email);

        const existingUser = await db.models[COLLECTIONS.USER].findOne({
            $or: [{ email: normalizedEmail }, { phone, countryCode }],
            isDeleted: false,
        });

        if (existingUser) {
            req.apiStatus = {
                isSuccess: false,
                message: "User with this email or phone already exists",
                status: 409,
                data: {},
                toastMessage: "User with this email or phone already exists",
            };
            return next();
        }

        const hashedPassword = await bcrypt.hash(normalizePassword(password), 10);

        const newUser = new db.models[COLLECTIONS.USER]({
            name,
            email: normalizedEmail,
            password: hashedPassword,
            countryCode,
            phone,
            address,
            waterQuantity,
            notes,
            isVerified: true,
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

export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
    const txId: string = req.txnId || "";
    const requestPath = `${req.baseUrl || ""}${req.path || ""}`;
    const actionLogger = userAuthLogger.child({ action: "loginUser", txId, requestPath });

    actionLogger.info("Processing user email/password login request");

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
            return next();
        }

        const db = req.db;
        const user = await db.models[COLLECTIONS.USER].findOne({ email, isDeleted: false });

        if (!user) {
            req.apiStatus = {
                isSuccess: false,
                message: "Invalid credentials",
                status: 401,
                data: {},
                toastMessage: "Invalid credentials",
            };
            actionLogger.warn("User not found for provided email");
            return next();
        }

        const passwordMatches = await bcrypt.compare(password, user.password);
        if (!passwordMatches) {
            req.apiStatus = {
                isSuccess: false,
                message: "Invalid credentials",
                status: 401,
                data: {},
                toastMessage: "Invalid credentials",
            };
            actionLogger.warn("Invalid password for user");
            return next();
        }

        const { accessToken, refreshToken } = buildTokens({
            id: user._id,
            role: USER_ROLES.USER,
            email: user.email,
        });

        await db.models[COLLECTIONS.ACCESS_TOKEN].deleteMany({
            userId: user._id,
            role: USER_ROLES.USER,
        });
        await db.models[COLLECTIONS.REFRESH_TOKEN].deleteMany({
            userId: user._id,
            role: USER_ROLES.USER,
        });

        await db.models[COLLECTIONS.ACCESS_TOKEN].create({
            token: accessToken,
            userId: user._id,
            role: USER_ROLES.USER,
        });
        await db.models[COLLECTIONS.REFRESH_TOKEN].create({
            token: refreshToken,
            userId: user._id,
            role: USER_ROLES.USER,
        });

        req.apiStatus = {
            isSuccess: true,
            message: "Login successful",
            status: 200,
            data: {
                isVerified: true,
                accessToken,
                refreshToken,
                expiryTime: new Date(Date.now() + config.ACCESS_TOKEN_EXPIRY * 60 * 1000),
                email: user.email,
                name: user.name,
            },
            toastMessage: "Logged in",
        };
        actionLogger.info("User login successful");
        return next();
    } catch (error) {
        actionLogger.error({ err: error }, "Failed to process user login");
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

        let decodedToken: { id: string; role: string; email?: string };

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
                role: USER_ROLES.USER,
            });

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

            const accessToken = jwt.sign(
                {
                    id: tokenFromDb.userId,
                    role: USER_ROLES.USER,
                    email: user.email,
                },
                jwtSecret,
                {
                    expiresIn: `${config.ACCESS_TOKEN_EXPIRY}m`,
                },
            );

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
                    email: user.email,
                    name: user.name,
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

export const sendForgotPasswordOTP = async (req: Request, res: Response, next: NextFunction) => {
    const txId: string = req.txnId || "";
    const requestPath = `${req.baseUrl || ""}${req.path || ""}`;
    const actionLogger = userAuthLogger.child({ action: "sendForgotPasswordOTP", txId, requestPath });

    actionLogger.info("Processing forgot password OTP send request");

    try {
        const email = normalizeEmail(req.body.email);
        const db = req.db;

        const user = await db.models[COLLECTIONS.USER].findOne({ email, isDeleted: false });
        if (!user) {
            req.apiStatus = {
                isSuccess: false,
                message: "User not found",
                status: 404,
                data: {},
                toastMessage: "User not found",
            };
            actionLogger.warn("User not found for forgot password");
            return next();
        }

        await db.models[COLLECTIONS.OTP].deleteMany({ email });

        const otpValue = config.ENVIRONMENT === "development" ? "1234" : generateOtp();
        const otpDoc = await db.models[COLLECTIONS.OTP].create({
            email,
            otp: otpValue,
        });
        console.log(`sending OTP email to ${email} with OTP: ${otpDoc.otp}`);
        await sendEmail(email, "Password reset OTP", `Your OTP is ${otpDoc.otp}`);
        console.log(`OTP for ${email}: ${otpDoc.otp}`);

        req.apiStatus = {
            isSuccess: true,
            message: "success",
            status: 200,
            data: "OTP sent successfully",
            toastMessage: "OTP sent",
        };
        actionLogger.info("Forgot password OTP sent successfully");
        return next();
    } catch (error) {
        actionLogger.error({ err: error }, "Failed to send forgot password OTP");
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

export const verifyForgotPasswordOTP = async (req: Request, res: Response, next: NextFunction) => {
    const txId: string = req.txnId || "";
    const requestPath = `${req.baseUrl || ""}${req.path || ""}`;
    const actionLogger = userAuthLogger.child({ action: "verifyForgotPasswordOTP", txId, requestPath });

    actionLogger.info("Verifying forgot password OTP");

    try {
        const email = normalizeEmail(req.body.email);
        const otp = typeof req.body.otp === "string" ? req.body.otp.trim() : "";
        const db = req.db;

        const otpDoc = await db.models[COLLECTIONS.OTP].findOne({
            email,
            otp,
        });

        if (!otpDoc) {
            req.apiStatus = {
                isSuccess: false,
                message: "Invalid OTP",
                status: 400,
                data: {},
                toastMessage: "Invalid OTP",
            };
            actionLogger.warn("Invalid OTP for forgot password");
            return next();
        }

        await db.models[COLLECTIONS.OTP].updateOne({ _id: otpDoc._id }, { $set: { isVerified: true } });

        req.apiStatus = {
            isSuccess: true,
            message: "OTP verified successfully",
            status: 200,
            data: { isVerified: true },
            toastMessage: "OTP verified",
        };
        actionLogger.info("Forgot password OTP verified successfully");
        return next();
    } catch (error) {
        actionLogger.error({ err: error }, "Failed to verify forgot password OTP");
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

export const updatePasswordWithOTP = async (req: Request, res: Response, next: NextFunction) => {
    const txId: string = req.txnId || "";
    const requestPath = `${req.baseUrl || ""}${req.path || ""}`;
    const actionLogger = userAuthLogger.child({ action: "updatePasswordWithOTP", txId, requestPath });

    actionLogger.info("Updating password using OTP");

    try {
        const email = normalizeEmail(req.body.email);
        const otp = typeof req.body.otp === "string" ? req.body.otp.trim() : "";
        const newPasswordRaw = normalizePassword(req.body.newPassword);

        const db = req.db;

        const otpDoc = await db.models[COLLECTIONS.OTP].findOne({ email, otp, isVerified: true });

        if (!otpDoc) {
            req.apiStatus = {
                isSuccess: false,
                message: "Invalid or unverified OTP",
                status: 400,
                data: {},
                toastMessage: "Invalid or unverified OTP",
            };
            actionLogger.warn("OTP not verified for password update");
            return next();
        }

        const user = await db.models[COLLECTIONS.USER].findOne({ email, isDeleted: false });

        if (!user) {
            req.apiStatus = {
                isSuccess: false,
                message: "User not found",
                status: 404,
                data: {},
                toastMessage: "User not found",
            };
            actionLogger.warn("User not found during password reset");
            return next();
        }

        const hashedPassword = await bcrypt.hash(newPasswordRaw, 10);
        user.password = hashedPassword;
        await user.save();

        await db.models[COLLECTIONS.OTP].deleteMany({ email });

        req.apiStatus = {
            isSuccess: true,
            message: "Password updated successfully",
            status: 200,
            data: {},
            toastMessage: "Password updated",
        };
        actionLogger.info("Password updated via OTP");
        return next();
    } catch (error) {
        actionLogger.error({ err: error }, "Failed to update password via OTP");
        req.apiStatus = {
            isSuccess: false,
            message: "Failed to update password",
            status: 500,
            data: {},
            toastMessage: "Failed to update password",
        };
        return next();
    }
};

export const updateUserProfile = async (req: Request, res: Response, next: NextFunction) => {
    const txId: string = req.txnId || "";
    const requestPath = `${req.baseUrl || ""}${req.path || ""}`;
    const actionLogger = userAuthLogger.child({ action: "updateUserProfile", txId, requestPath });

    actionLogger.info("Processing user profile update request");

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

        const db = req.db;
        const payload = req.body;

        // prevent email/password updates here
        delete payload.email;
        delete payload.password;

        const updatedUser = await db.models[COLLECTIONS.USER].findByIdAndUpdate(
            userId,
            { $set: payload },
            { new: true, projection: { password: 0 } },
        );

        if (!updatedUser) {
            req.apiStatus = {
                isSuccess: false,
                message: "User not found",
                status: 404,
                data: {},
                toastMessage: "User not found",
            };
            actionLogger.warn("User not found for profile update");
            return next();
        }

        req.apiStatus = {
            isSuccess: true,
            message: "success",
            status: 200,
            data: updatedUser,
            toastMessage: "Profile updated successfully",
        };
        actionLogger.info("User profile updated successfully");
        return next();
    } catch (error) {
        actionLogger.error({ err: error }, "Failed to update user profile");
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

        const userWithArea = await db.models[COLLECTIONS.USER].aggregate([
            { $match: { _id: userId, isDeleted: false } },
            {
                $lookup: {
                    from: COLLECTIONS.AREA,
                    localField: "address.area",
                    foreignField: "_id",
                    as: "areaData",
                },
            },
            {
                $addFields: {
                    areaId: { $arrayElemAt: ["$areaData", 0] },
                },
            },
            { $project: { password: 0, areaData: 0 } },
        ]);

        const user = userWithArea[0];

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
