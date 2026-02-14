import { Router } from "express";
import { entryPoint } from "../../../middleware/entryPoint";
import { exitPoint } from "../../../middleware/exitPoint";
import { dbSelector } from "../../../middleware/dbSelector";
import { validate } from "../../../middleware/zodValidator";
// import { userAuthenticator } from "../../../middleware/authenticator";  
import {
    sendUserOTPSchema,
    verifyUserOTPSchema,
    refreshUserTokenSchema,
    updateUserProfileSchema,
    registerUserSchema,
} from "../../../schemas/v1/userAuth";
import {
    sendUserOTP,
    registerUser,
    verifyUserOTP,
    refreshUserToken,
    logoutUser,
    updateUserProfile,
    getUserProfile,
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
 *     summary: Register a new user
 *     description: Create a new user account. No authentication required.
 *     tags: [User/Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - phone
 *               - countryCode
 *               - address
 *               - waterQuantity
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
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
 *                     example: "123"
 *                   street:
 *                     type: string
 *                     example: "Main St"
 *                   area:
 *                     type: string
 *                     description: Area ID (ObjectId)
 *                     example: "64d2fa92e5b5f7765e4e13a2"
 *                   city:
 *                     type: string
 *                     example: "Ahmedabad"
 *                   pincode:
 *                     type: string
 *                     example: "380009"
 *                   landmark:
 *                     type: string
 *                     example: "Near Park"
 *               waterQuantity:
 *                 type: number
 *                 example: 30
 *               notes:
 *                 type: string
 *                 example: "Special instructions"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 210
 *                 message:
 *                   type: string
 *                   example: "User created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "64d2fa92e5b5f7765e4e13a2"
 *                 toastMessage:
 *                   type: string
 *                   example: "User created successfully"
 *       409:
 *         description: User already exists
 *       500:
 *         description: Internal server error
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
 * /v1/user/auth/verifyOTP:
 *   post:
 *     summary: Verify OTP and issue user tokens
 *     description: Verify the OTP sent to the user's phone. Returns access and refresh tokens if valid and user exists.
 *     tags: [User/Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - countryCode
 *               - phone
 *               - otp
 *             properties:
 *               countryCode:
 *                 type: string
 *                 description: Country code prefix
 *                 example: "91"
 *               phone:
 *                 type: string
 *                 description: Phone number that received the OTP
 *                 example: "9876543210"
 *               otp:
 *                 type: string
 *                 description: OTP received on the phone
 *                 example: "1234"
 *     responses:
 *       200:
 *         description: OTP verified successfully
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
 *                   example: "OTP verified successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     isVerified:
 *                       type: boolean
 *                       example: true
 *                     accessToken:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     refreshToken:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     expiryTime:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-11-14T17:02:33.934Z"
 *                 toastMessage:
 *                   type: string
 *                   example: "OTP verified"
 *       400:
 *         description: Invalid OTP or validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 400
 *                 message:
 *                   type: string
 *                   example: "Invalid OTP"
 *                 toastMessage:
 *                   type: string
 *                   example: "Invalid OTP"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 404
 *                 message:
 *                   type: string
 *                   example: "User not found"
 *                 toastMessage:
 *                   type: string
 *                   example: "User not found. Please register first."
 *       500:
 *         description: Internal server error
 */
router.post(
    "/verifyOTP",
    entryPoint,
    validate(verifyUserOTPSchema),
    dbSelector,
    verifyUserOTP,
    exitPoint,
);

/**
 * @swagger
 * /v1/user/auth/refreshToken:
 *   post:
 *     summary: Refresh user access token
 *     description: Issue a new access token using a valid refresh token.
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
 *                 description: Valid refresh token
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Access token refreshed successfully
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
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *                     expiryTime:
 *                       type: string
 *                       format: date-time
 *                 toastMessage:
 *                   type: string
 *                   example: "Token refreshed"
 *       400:
 *         description: Invalid or expired refresh token
 *       500:
 *         description: Internal server error
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
 * /v1/user/auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Invalidate user's current session by deleting their access and refresh tokens.
 *     tags: [User/Auth]
 *     security:
 *       - userBearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
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
 *                   example: "success"
 *                 data:
 *                   type: string
 *                   example: "Logged out successfully"
 *                 toastMessage:
 *                   type: string
 *                   example: "Logged out successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post(
    "/logout",
    entryPoint,
    dbSelector,
    userAuthenticator,
    logoutUser,
    exitPoint,
);

/**
 * @swagger
 * /v1/user/auth/sendOTP:
 *   post:
 *     summary: Send an OTP to the user's phone
 *     description: Only sends OTP if the user exists and their profile (name) is completed.
 *     tags: [User/Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - countryCode
 *               - phone
 *             properties:
 *               countryCode:
 *                 type: string
 *                 description: E.164 compatible country code prefix
 *                 example: "91"
 *               phone:
 *                 type: string
 *                 description: User's phone number without country code
 *                 example: "9876543210"
 *     responses:
 *       200:
 *         description: OTP sent successfully
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
 *                   example: "success"
 *                 data:
 *                   type: string
 *                   example: "OTP sent successfully"
 *                 toastMessage:
 *                   type: string
 *                   example: "OTP sent"
 *       400:
 *         description: OTP already sent recently
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 400
 *                 message:
 *                   type: string
 *                   example: "OTP already sent"
 *                 toastMessage:
 *                   type: string
 *                   example: "OTP already sent"
 *       404:
 *         description: User not registered or profile incomplete
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 404
 *                 message:
 *                   type: string
 *                   example: "User not registered"
 *                 toastMessage:
 *                   type: string
 *                   example: "User not registered, please register first"
 *       500:
 *         description: Internal server error
 */
router.post(
    "/sendOTP",
    entryPoint,
    validate(sendUserOTPSchema),
    dbSelector,
    sendUserOTP,
    exitPoint,
);

/**
 * @swagger
 * /v1/user/auth/profile:
 *   put:
 *     summary: Update user profile
 *     description: Update the authenticated user's profile information.
 *     tags: [User/Auth]
 *     security:
 *       - userBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               address:
 *                 type: object
 *                 properties:
 *                   houseNo:
 *                     type: string
 *                     example: "123"
 *                   street:
 *                     type: string
 *                     example: "Main St"
 *                   area:
 *                     type: string
 *                     example: "64d2fa92e5b5f7765e4e13a2"
 *                   city:
 *                     type: string
 *                     example: "Ahmedabad"
 *                   pincode:
 *                     type: string
 *                     example: "380009"
 *                   landmark:
 *                     type: string
 *                     example: "Near Park"
 *               waterQuantity:
 *                 type: number
 *                 example: 30
 *               notes:
 *                 type: string
 *                 example: "Special instructions"
 *     responses:
 *       200:
 *         description: Profile updated successfully
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
 *                   example: "Profile updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     countryCode:
 *                       type: string
 *                     address:
 *                       type: object
 *                     waterQuantity:
 *                       type: number
 *                     notes:
 *                       type: string
 *                     areaId:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         city:
 *                           type: string
 *                         pincode:
 *                           type: string
 *                 toastMessage:
 *                   type: string
 *                   example: "Profile updated successfully"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.put(
    "/profile",
    entryPoint,
    validate(updateUserProfileSchema),
    dbSelector,
    userAuthenticator,
    updateUserProfile,
    exitPoint,
);

/**
 * @swagger
 * /v1/user/auth/profile:
 *   get:
 *     summary: Get user profile
 *     description: Fetch the authenticated user's profile information.
 *     tags: [User/Auth]
 *     security:
 *       - userBearerAuth: []
 *     responses:
 *       200:
 *         description: Profile fetched successfully
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
 *                   example: "Profile fetched successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     countryCode:
 *                       type: string
 *                     address:
 *                       type: object
 *                     waterQuantity:
 *                       type: number
 *                     notes:
 *                       type: string
 *                     areaId:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         city:
 *                           type: string
 *                         pincode:
 *                           type: string
 *                 toastMessage:
 *                   type: string
 *                   nullable: true
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
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