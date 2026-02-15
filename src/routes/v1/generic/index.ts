import { Router } from "express";
import { getAllConstants, generatePresignedPost, getSignedUrlController, getLocationData, getAllPincodes } from "../../../controller/v1/generic/index";
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
 * /v1/generic/image:
 *   post:
 *     tags:
 *       - generic
 *     summary: Generate Presigned URL
 *     deprecated: false
 *     description: This endpoint generates a presigned URL that allows secure, temporary access to a specific resource in the storage system. The presigned URL can be used for uploading or downloading files without exposing sensitive credentials.
 *     parameters:
 *       - in: query
 *         name: isDemo
 *         schema:
 *           type: boolean
 *         required: false
 *         description: Set to true to use demo database
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileName
 *             properties:
 *               fileName:
 *                 type: string
 *                 description: Enter file name
 *                 example: "123.png"
 *     responses:
 *       200:
 *         description: Presigned URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isSuccess:
 *                   type: boolean
 *                   example: true
 *                 status:
 *                   type: number
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Success
 *                 data:
 *                   type: object
 *                   properties:
 *                     signedPost:
 *                       type: string
 *                       description: The presigned URL for uploading the file
 *                       example: "https://developmentexelon.s3.ap-south-1.amazonaws.com/123.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIAXXXXXXXXXXXXXXXX%2F20240612%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20240612T125526Z&X-Amz-Expires=3600&X-Amz-Signature=c12a2af175287fc25882a459373907e73710d47d07ffcd846a5761ff528fabb1&X-Amz-SignedHeaders=host&x-id=PutObject"
 *                 toastMessage:
 *                   type: string
 *                   example: Success
 *       400:
 *         description: Bad request - fileName is required
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
 *                   example: 400
 *                 message:
 *                   type: string
 *                   example: fileName is required and must be a non-empty string
 *                 toastMessage:
 *                   type: string
 *                   example: fileName is required
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
 *                   example: Error generating signed POST
 *                 toastMessage:
 *                   type: string
 *                   example: Error generating signed POST
 */
router.post("/image", entryPoint, dbSelector, generatePresignedPost, exitPoint);

/**
 * @swagger
 * /v1/generic/getImage:
 *   post:
 *     tags:
 *       - generic
 *     summary: Get signed URL
 *     deprecated: false
 *     description: This endpoint retrieves a signed URL that allows secure access to a specific resource stored in the cloud. The signed URL enables users to perform actions such as downloading or viewing files without needing to authenticate again, ensuring a seamless experience.
 *     parameters:
 *       - in: query
 *         name: isDemo
 *         schema:
 *           type: boolean
 *         required: false
 *         description: Set to true to use demo database
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileName
 *             properties:
 *               fileName:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of file names
 *                 example: ["123.png", "456.jpg"]
 *     responses:
 *       200:
 *         description: Signed URLs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isSuccess:
 *                   type: boolean
 *                   example: true
 *                 status:
 *                   type: number
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Success
 *                 data:
 *                   type: object
 *                   properties:
 *                     signedLink:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Array of signed URLs for the requested files
 *                       example: ["https://developmentexelon.s3.ap-south-1.amazonaws.com/123.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIAXXXXXXXXXXXXXXXX%2F20240612%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20240612T125514Z&X-Amz-Expires=NaN&X-Amz-Signature=d7e1c519ebd6965fe369b2946cd7d112a6bae050c76e7c328cdf4b7601621344&X-Amz-SignedHeaders=host&x-id=GetObject"]
 *                 toastMessage:
 *                   type: string
 *                   example: Success
 *       400:
 *         description: Bad request - fileName is required
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
 *                   example: 400
 *                 message:
 *                   type: string
 *                   example: fileName is required and must be a non-empty array
 *                 toastMessage:
 *                   type: string
 *                   example: fileName is required and must be an array
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
 *                   example: Error getting signed URLs
 *                 toastMessage:
 *                   type: string
 *                   example: Error getting signed URLs
 */
router.post("/getImage", entryPoint, dbSelector, getSignedUrlController, exitPoint);

/**
 * @swagger
 * /v1/generic/location:
 *   post:
 *     tags:
 *       - generic
 *     summary: Get location data (states and districts) for India
 *     description: >
 *       Retrieves a list of states or districts (cities) for India. The country is always India (IN).
 *       - type=state returns all states in India
 *       - type=district with stateCode returns all districts (cities) for that state in India
 *     parameters:
 *       - in: query
 *         name: isDemo
 *         schema:
 *           type: boolean
 *         required: false
 *         description: Set to true to use demo database
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [state, district]
 *                 description: Type of location data to retrieve. Use state to get all states, or district to get districts for a specific state.
 *                 example: "state"
 *               state:
 *                 type: string
 *                 description: ISO2 state name required when type is district. Examples include MH for Maharashtra and KA for Karnataka.
 *                 example: "Karnataka"
 *           examples:
 *             GetStates:
 *               summary: Get all states in India
 *               value:
 *                 type: state
 *             GetDistricts:
 *               summary: Get districts in Maharashtra
 *               value:
 *                 type: district
 *                 state: Karnataka
 *     responses:
 *       200:
 *         description: Location data retrieved successfully
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
 *                   example: Data fetched successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         description: Name of the state or district
 *             examples:
 *               StatesResponse:
 *                 summary: Example response for states
 *                 value:
 *                   status: 200
 *                   message: Data fetched successfully
 *                   data:
 *                     - name: Maharashtra
 *                     - name: Karnataka
 *                     - name: Delhi
 *               DistrictsResponse:
 *                 summary: Example response for districts
 *                 value:
 *                   status: 200
 *                   message: Data fetched successfully
 *                   data:
 *                     - name: Mumbai
 *                     - name: Pune
 *                     - name: Nagpur
 *       400:
 *         description: Bad request - Missing or invalid parameters
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
 *                   example: stateCode is required for type=district
 *                 toastMessage:
 *                   type: string
 *                   example: stateCode is required
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
 *                   example: An unexpected error occurred. Please try again
 *                 toastMessage:
 *                   type: string
 *                   example: An unexpected error occurred. Please try again
 */
router.post("/location", entryPoint, dbSelector, getLocationData, exitPoint);

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

