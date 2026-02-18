import { Router } from "express";
import { getAllConstants, getAllPincodes } from "../../../controller/v1/generic/index";
import { entryPoint } from "../../../middleware/entryPoint";
import { exitPoint } from "../../../middleware/exitPoint";
import { dbSelector } from "../../../middleware/dbSelector";

const router = Router();

/**
 * @swagger
 * /v1/generic/constants:
 *   get:
 *     tags:
 *       - generic
 *     summary: Get all constants
 *     description: This endpoint retrieves a collection of constants used throughout the application. Constants include collections, user roles, environment types, enquiry types, service categories, and other application-wide constants.
 *     security:
 *       - genericBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isDemo
 *         schema:
 *           type: boolean
 *         required: false
 *         description: Set to true to use demo database
 *     responses:
 *       200:
 *         description: Constants data retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isSuccess:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: number
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     COLLECTIONS:
 *                       type: object
 *                       description: Database collection names
 *                       example:
 *                         ACCESS_TOKEN: "accesstokens"
 *                         REFRESH_TOKEN: "refreshtokens"
 *                         USER: "users"
 *                         OTP: "otps"
 *                         ADMIN: "admins"
 *                         AREA: "areas"
 *                         SLOT: "slots"
 *                         SLOT_SUBSCRIPTION: "slotSubscriptions"
 *                     USER_ROLES:
 *                       type: object
 *                       description: User role types
 *                       example:
 *                         USER: "user"
 *                         ADMIN: "admin"
 *                     ENVIRONMENT:
 *                       type: object
 *                       description: Environment types
 *                       example:
 *                         PRODUCTION: "PROD"
 *                         STAGED: "STAGE"
 *                         DEVELOPMENT: "DEV"
 *                     CONSTANTS:
 *                       type: object
 *                       description: Application constants
 *                       example:
 *                         MONGODB_RECONNECT_INTERVAL: 5000
 *                         MIN_RESEND_INTERVAL_IN_SECONDS: 60
 *                     SUBSCRIPTION_STATUS:
 *                       type: object
 *                       description: Subscription status options
 *                       example:
 *                         BOOKED: "Booked"
 *                         DELIVERED: "Delivered"
 *                         CANCELLED: "Cancelled"
 *                         MISSED: "Missed"
 *                     SLOT_STATUS:
 *                       type: object
 *                       description: Slot status options
 *                       example:
 *                         AVAILABLE: "Available"
 *                         FULL: "Full"
 *                         CLOSED: "Closed"
 *                     EXTRA_REQUEST_STATUS:
 *                       type: object
 *                       description: Extra request status options
 *                       example:
 *                         NONE: "None"
 *                         PENDING: "Pending"
 *                         APPROVED: "Approved"
 *                         REJECTED: "Rejected"
 *                 toastMessage:
 *                   type: string
 *                   example: Data fetched successfully
 *       401:
 *         description: Unauthorized access (missing or invalid token)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isSuccess:
 *                   type: boolean
 *                   example: false
 *                 statusCode:
 *                   type: number
 *                   example: 401
 *                 message:
 *                   type: string
 *                   example: "Unauthorized access. Please login again."
 *       404:
 *         description: Constants data not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isSuccess:
 *                   type: boolean
 *                   example: false
 *                 statusCode:
 *                   type: number
 *                   example: 404
 *                 message:
 *                   type: string
 *                   example: Data not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isSuccess:
 *                   type: boolean
 *                   example: false
 *                 statusCode:
 *                   type: number
 *                   example: 500
 *                 message:
 *                   type: string
 *                   example: An unexpected error occurred. Please try again
 */
router.get("/constants", entryPoint, dbSelector, getAllConstants, exitPoint);

/**
 * @swagger
 * /v1/generic/pincode:
 *   post:
 *     tags:
 *       - generic
 *     summary: Get Karnataka area pincodes or search within them
 *     description: Retrieves a list of Karnataka area pincodes based on the provided search term or returns all Karnataka area pincodes if no search term is provided.
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               search:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     term:
 *                       type: string
 *                       example: "574154"
 *                     fields:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["pincode", "area", "district"]
 *                     startsWith:
 *                       type: boolean
 *                       example: true
 *                     endsWith:
 *                       type: boolean
 *                       example: false
 *               options:
 *                 type: object
 *                 properties:
 *                   page:
 *                     type: integer
 *                     example: 1
 *                   itemsPerPage:
 *                     type: integer
 *                     example: 10
 *     responses:
 *       200:
 *         description: Pincode data retrieved successfully
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
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalCount:
 *                       type: integer
 *                       example: 1
 *                     tableData:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           pincode:
 *                             type: string
 *                             example: "574154"
 *                           officeName:
 *                             type: string
 *                             example: "Mulki S.O."
 *                           officeType:
 *                             type: string
 *                             example: "Sub Office"
 *                           deliveryStatus:
 *                             type: string
 *                             example: "Delivery"
 *                           district:
 *                             type: string
 *                             example: "Dakshina Kannada"
 *                           state:
 *                             type: string
 *                             example: "Karnataka"
 *                           region:
 *                             type: string
 *                             example: "South Karnataka"
 *                           circle:
 *                             type: string
 *                             example: "Karnataka"
 *       500:
 *         description: Internal server error
 */
router.post("/pincode", entryPoint, dbSelector, getAllPincodes, exitPoint);

export default router;

