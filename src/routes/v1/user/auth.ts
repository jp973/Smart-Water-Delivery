import { Router } from "express";
import { entryPoint } from "../../../middleware/entryPoint";
import { exitPoint } from "../../../middleware/exitPoint";
import { dbSelector } from "../../../middleware/dbSelector";
import { validate } from "../../../middleware/zodValidator";
import {
    registerUserSchema,
    userLoginSchema,
    refreshUserTokenSchema,
    updateUserProfileSchema,
    sendForgotPasswordOTPSchema,
    verifyForgotPasswordOTPSchema,
    updatePasswordWithOTPSchema,
} from "../../../schemas/v1/userAuth";
import {
    registerUser,
    loginUser,
    refreshUserToken,
    logoutUser,
    updateUserProfile,
    getUserProfile,
    sendForgotPasswordOTP,
    verifyForgotPasswordOTP,
    updatePasswordWithOTP,
} from "../../../controller/v1/user/auth";
import { userAuthenticator } from "../../../middleware/authenticator";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: User Auth
 *   description: User authentication and registration APIs for the mobile app
 */

/**
 * @swagger
 * /v1/user/auth/register:
 *   post:
 *     summary: Register a new user with email and password
 *     tags: [User/Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - phone
 *               - countryCode
 *               - address
 *               - waterQuantity
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 example: "User@123"
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *               countryCode:
 *                 type: string
 *                 example: "91"
 *               address:
 *                 type: object
 *                 properties:
 *                   houseNo:
 *                     type: string
 *                   street:
 *                     type: string
 *                   area:
 *                     type: string
 *                   city:
 *                     type: string
 *                   pincode:
 *                     type: string
 *                   landmark:
 *                     type: string
 *               waterQuantity:
 *                 type: number
 *                 example: 20
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 */
router.post(
    "/register",
    entryPoint,
    validate(registerUserSchema),
    dbSelector,
    registerUser,
    exitPoint,
);

/**
 * @swagger
 * /v1/user/auth/login:
 *   post:
 *     summary: Login user using email and password
 *     tags: [User/Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 example: "User@123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Login successful"
 *                 data:
 *                   type: object
 *                   properties:
 *                     isVerified:
 *                       type: boolean
 *                       example: true
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *                     expiryTime:
 *                       type: string
 *                       format: date-time
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                 toastMessage:
 *                   type: string
 *                   example: "Logged in"
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", entryPoint, validate(userLoginSchema), dbSelector, loginUser, exitPoint);

/**
 * @swagger
 * /v1/user/auth/refreshToken:
 *   post:
 *     summary: Refresh user access token
 *     tags: [User/Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token issued during login
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       400:
 *         description: Invalid or expired refresh token
 *       404:
 *         description: User not found
 */
router.post(
    "/refreshToken",
    entryPoint,
    validate(refreshUserTokenSchema),
    dbSelector,
    refreshUserToken,
    exitPoint,
);

/**
 * @swagger
 * /v1/user/auth/forgot/sendOTP:
 *   post:
 *     summary: Send forgot password OTP to user's email
 *     tags: [User/Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       404:
 *         description: User not found
 */
router.post(
    "/forgot/sendOTP",
    entryPoint,
    validate(sendForgotPasswordOTPSchema),
    dbSelector,
    sendForgotPasswordOTP,
    exitPoint,
);

/**
 * @swagger
 * /v1/user/auth/forgot/verifyOTP:
 *   post:
 *     summary: Verify forgot password OTP
 *     tags: [User/Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               otp:
 *                 type: string
 *                 example: "1234"
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *       400:
 *         description: Invalid OTP
 */
router.post(
    "/forgot/verifyOTP",
    entryPoint,
    validate(verifyForgotPasswordOTPSchema),
    dbSelector,
    verifyForgotPasswordOTP,
    exitPoint,
);

/**
 * @swagger
 * /v1/user/auth/forgot/updatePassword:
 *   post:
 *     summary: Update password after OTP verification
 *     tags: [User/Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Email not verified or OTP session expired
 *       404:
 *         description: User not found
 */
router.post(
    "/forgot/updatePassword",
    entryPoint,
    validate(updatePasswordWithOTPSchema),
    dbSelector,
    updatePasswordWithOTP,
    exitPoint,
);

/**
 * @swagger
 * /v1/user/auth/updateProfile:
 *   put:
 *     summary: Update user profile
 *     tags: [User/Auth]
 *     security:
 *       - userBearerAuth: []
 */
router.put(
    "/updateProfile",
    entryPoint,
    dbSelector,
    userAuthenticator,
    validate(updateUserProfileSchema),
    updateUserProfile,
    exitPoint,
);

router.post("/logout", entryPoint, dbSelector, userAuthenticator, logoutUser, exitPoint);

/**
 * @swagger
 * /v1/user/auth/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [User/Auth]
 *     security:
 *       - userBearerAuth: []
 */
router.get(
    "/profile",
    entryPoint,
    dbSelector,
    userAuthenticator,
    getUserProfile,
    exitPoint,
);

export default router;
