import { Router } from "express";
import { entryPoint } from "../../../middleware/entryPoint";
import { exitPoint } from "../../../middleware/exitPoint";
import { dbSelector } from "../../../middleware/dbSelector";
import { validate } from "../../../middleware/zodValidator";
import { adminAuthenticator } from "../../../middleware/authenticator";
import {
    sendAdminOTPSchema,
    verifyAdminOTPSchema,
    refreshAdminTokenSchema,
    updateAdminProfileSchema
} from "../../../schemas/v1/adminAuth";
import {
    sendAdminOTP,
    verifyAdminOTP,
    refreshAdminToken,
    logout,
    updateAdminProfile,
    getAdminProfile,
} from "../../../controller/v1/admin/auth";

const router = Router();

/**
 * @swagger
 * /v1/admin/auth/sendOTP:
 *   post:
 *     summary: Send an OTP to the admin's phone
 *     tags:
 *       - Admin/Auth
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
 *                 description: Admin's phone number without country code
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
 *                   nullable: true
 *                   example: "OTP sent"
 *       400:
 *         description: Missing parameters or resend cool down not elapsed
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
 *                 data:
 *                   type: object
 *                   nullable: true
 *                   example: null
 *                 toastMessage:
 *                   type: string
 *                   example: "OTP already sent"
 *       500:
 *         description: Unexpected error while sending OTP
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 500
 *                 message:
 *                   type: string
 *                   example: "Error sending OTP"
 *                 data:
 *                   type: object
 *                   nullable: true
 *                   example: null
 *                 toastMessage:
 *                   type: string
 *                   example: "Error sending OTP"
 */
router.post(
    "/sendOTP",
    entryPoint,
    validate(sendAdminOTPSchema),
    dbSelector,
    sendAdminOTP,
    exitPoint,
);

/**
 * @swagger
 * /v1/admin/auth/verifyOTP:
 *   post:
 *     summary: Verify OTP and issue admin tokens
 *     tags:
 *       - Admin/Auth
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
 *                       description: Indicates if the OTP was successfully verified
 *                       example: true
 *                     isNewAdmin:
 *                       type: boolean
 *                       description: Indicates if this is a new admin or profile incomplete
 *                       example: true
 *                     profileCompleted:
 *                       type: boolean
 *                       description: Indicates if the admin has completed their profile (name set)
 *                       example: false
 *                     accessToken:
 *                       type: string
 *                       description: JWT access token for authentication
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     refreshToken:
 *                       type: string
 *                       description: JWT refresh token for obtaining new access tokens
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     expiryTime:
 *                       type: string
 *                       format: date-time
 *                       description: Expiry time of the access token
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
 *                 data:
 *                   type: object
 *                   example: {}
 *                 toastMessage:
 *                   type: string
 *                   example: "Invalid OTP"
 *       500:
 *         description: Unexpected error while verifying OTP
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 500
 *                 message:
 *                   type: string
 *                   example: "Error verifying OTP"
 *                 data:
 *                   type: object
 *                   example: {}
 *                 toastMessage:
 *                   type: string
 *                   example: "Error verifying OTP"
 */
router.post(
    "/verifyOTP",
    entryPoint,
    validate(verifyAdminOTPSchema),
    dbSelector,
    verifyAdminOTP,
    exitPoint,
);

/**
 * @swagger
 * /v1/admin/auth/refreshToken:
 *   post:
 *     summary: Refresh admin access token
 *     tags:
 *       - Admin/Auth
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
 *                       description: New JWT access token
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     refreshToken:
 *                       type: string
 *                       description: Same refresh token (not rotated)
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     expiryTime:
 *                       type: string
 *                       format: date-time
 *                       description: Expiry time of the new access token
 *                       example: "2026-02-10T23:15:33.934Z"
 *                 toastMessage:
 *                   type: string
 *                   example: "Token refreshed"
 *       400:
 *         description: Invalid or expired refresh token
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
 *                   example: "Refresh token invalid or expired"
 *                 data:
 *                   type: object
 *                   example: {}
 *                 toastMessage:
 *                   type: string
 *                   example: "Refresh token invalid or expired"
 *       404:
 *         description: Admin not found
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
 *                   example: "Admin not found"
 *                 data:
 *                   type: object
 *                   example: {}
 *                 toastMessage:
 *                   type: string
 *                   example: "Admin not found"
 *       500:
 *         description: Unexpected error while refreshing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 500
 *                 message:
 *                   type: string
 *                   example: "Error refreshing access token"
 *                 data:
 *                   type: object
 *                   example: {}
 *                 toastMessage:
 *                   type: string
 *                   example: "Error refreshing access token"
 */
router.post(
    "/refreshToken",
    entryPoint,
    validate(refreshAdminTokenSchema),
    dbSelector,
    refreshAdminToken,
    exitPoint,
);

/**
 * @swagger
 * /v1/admin/auth/updateProfile:
 *   put:
 *     summary: Update admin profile
 *     tags:
 *       - Admin/Auth
 *     security:
 *       - adminBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Admin's name
 *                 example: "John Doe"
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
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "John Doe"
 *                     phone:
 *                       type: string
 *                       example: "9876543210"
 *                     countryCode:
 *                       type: string
 *                       example: "91"
 *                 toastMessage:
 *                   type: string
 *                   example: "Profile updated successfully"
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 401
 *                 message:
 *                   type: string
 *                   example: "Unauthorized access. Please login again."
 *                 data:
 *                   type: object
 *                   example: {}
 *                 toastMessage:
 *                   type: string
 *                   example: "Unauthorized access. Please login again."
 *       404:
 *         description: Admin not found
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
 *                   example: "Admin not found"
 *                 data:
 *                   type: object
 *                   example: {}
 *                 toastMessage:
 *                   type: string
 *                   example: "Admin not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 500
 *                 message:
 *                   type: string
 *                   example: "Something went wrong. Please try again later."
 *                 data:
 *                   type: object
 *                   example: {}
 *                 toastMessage:
 *                   type: string
 *                   example: "Something went wrong. Please try again later."
 */
router.put(
    "/updateProfile",
    entryPoint,
    dbSelector,
    adminAuthenticator,
    validate(updateAdminProfileSchema),
    updateAdminProfile,
    exitPoint,
);

/**
 * @swagger
 * /v1/admin/auth/logout:
 *   post:
 *     summary: Logout admin
 *     tags:
 *       - Admin/Auth
 *     security:
 *       - adminBearerAuth: []
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
 *         description: Unauthorized (missing or invalid token)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 401
 *                 message:
 *                   type: string
 *                   example: "Unauthorized access. Please login again."
 *                 data:
 *                   type: object
 *                   example: {}
 *                 toastMessage:
 *                   type: string
 *                   example: "Unauthorized access. Please login again."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 500
 *                 message:
 *                   type: string
 *                   example: "Something went wrong. Please try again later."
 *                 data:
 *                   type: object
 *                   example: {}
 *                 toastMessage:
 *                   type: string
 *                   example: "Something went wrong. Please try again later."
 */
router.post("/logout", entryPoint, dbSelector, adminAuthenticator, logout, exitPoint);

/**
 * @swagger
 * /v1/admin/auth/profile:
 *   get:
 *     summary: Get admin profile
 *     tags:
 *       - Admin/Auth
 *     security:
 *       - adminBearerAuth: []
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
 *                   $ref: '#/components/schemas/Admin'
 *                 toastMessage:
 *                   type: string
 *                   nullable: true
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Admin not found
 *       500:
 *         description: Internal server error
 */
router.get(
    "/profile",
    entryPoint,
    dbSelector,
    adminAuthenticator,
    getAdminProfile,
    exitPoint
);

export default router;
