import { Router } from "express";
import { entryPoint } from "../../../middleware/entryPoint";
import { exitPoint } from "../../../middleware/exitPoint";
import { dbSelector } from "../../../middleware/dbSelector";
import { validate } from "../../../middleware/zodValidator";
import { userAuthenticator } from "../../../middleware/authenticator";
import {
    getCurrentSlot,
    cancelSlotSubscription,
    requestExtraQuantity,
    getUserSlotHistory,
} from "../../../controller/v1/user/slot";
import {
    cancelSubscriptionSchema,
    requestExtraQuantitySchema,
    getUserSlotHistorySchema,
} from "../../../schemas/v1/slot";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: User Slot
 *   description: Slot management for users
 */

/**
 * @swagger
 * /v1/user/slot/current:
 *   get:
 *     summary: Get current/upcoming slot for the user
 *     tags: [User/Slot]
 *     security:
 *       - userBearerAuth: []
 *     responses:
 *       200:
 *         description: Current slot fetched successfully
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
 *                   example: "Current slot fetched successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     slot:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         date:
 *                           type: string
 *                           format: date-time
 *                         startTime:
 *                           type: string
 *                           format: date-time
 *                         endTime:
 *                           type: string
 *                           format: date-time
 *                         areaId:
 *                           type: object
 *                         capacity:
 *                           type: integer
 *                         currentBookingsCount:
 *                           type: integer
 *                         bookingCutoffTime:
 *                           type: string
 *                           format: date-time
 *                         status:
 *                           type: string
 *                     subscription:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         customerId:
 *                           type: string
 *                         slotId:
 *                           type: string
 *                         quantity:
 *                           type: integer
 *                         status:
 *                           type: string
 *                         extraQuantity:
 *                           type: integer
 *                         extraRequestStatus:
 *                           type: string
 *             example:
 *               status: 200
 *               message: "Current slot fetched successfully"
 *               data:
 *                 slot:
 *                   _id: "6991f98c6e4e38c7d5050fdb"
 *                   date: "2026-02-16T00:00:00.000Z"
 *                   startTime: "2026-02-16T06:00:00.000Z"
 *                   endTime: "2026-02-16T07:00:00.000Z"
 *                   areaId:
 *                     _id: "6991f60889817aa62340410f"
 *                     name: "Kenchanakere"
 *                     description: "Residential area in the north"
 *                     city: "mulki"
 *                     pincode: "574154"
 *                   capacity: 400
 *                   currentBookingsCount: 240
 *                   bookingCutoffTime: "2026-02-16T04:30:00.000Z"
 *                   status: "Available"
 *                 subscription:
 *                   _id: "6991f98c6e4e38c7d5050fdf"
 *                   customerId: "6991820300914c506604f1d6"
 *                   slotId: "6991f98c6e4e38c7d5050fdb"
 *                   quantity: 100
 *                   status: "Booked"
 *                   extraQuantity: 0
 *                   extraRequestStatus: "None"
 *               toastMessage: null
 *       404:
 *         description: User area not found
 */
router.get(
    "/current",
    entryPoint,
    dbSelector,
    userAuthenticator,
    getCurrentSlot,
    exitPoint
);

/**
 * @swagger
 * /v1/user/slot/cancel/{id}:
 *   post:
 *     summary: Cancel a slot subscription
 *     tags: [User/Slot]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subscription ID
 *     security:
 *       - userBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Cancelled]
 *                 example: Cancelled
 *     responses:
 *       200:
 *         description: Subscription cancelled successfully
 *       400:
 *         description: Cancellation period expired
 *       404:
 *         description: Subscription not found
 */
router.post(
    "/cancel/:id",
    entryPoint,
    validate(cancelSubscriptionSchema),
    dbSelector,
    userAuthenticator,
    cancelSlotSubscription,
    exitPoint
);

/**
 * @swagger
 * /v1/user/slot/requestExtra/{id}:
 *   post:
 *     summary: Request extra water quantity for a slot
 *     tags: [User/Slot]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subscription ID
 *     security:
 *       - userBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: number
 *                 example: 2
 *     responses:
 *       200:
 *         description: Extra quantity requested successfully
 *       404:
 *         description: Subscription not found
 */
router.post(
    "/requestExtra/:id",
    entryPoint,
    validate(requestExtraQuantitySchema),
    dbSelector,
    userAuthenticator,
    requestExtraQuantity,
    exitPoint
);

/**
 * @swagger
 * /v1/user/slot/history:
 *   post:
 *     summary: Get delivery history for the user
 *     tags: [User/Slot]
 *     security:
 *       - userBearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               filters:
 *                 type: object
 *                 example: { "status": "Delivered" }
 *               options:
 *                 type: object
 *                 properties:
 *                   page:
 *                     type: number
 *                     example: 1
 *                   itemsPerPage:
 *                     type: number
 *                     example: 10
 *                   sortBy:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["createdAt"]
 *                   sortDesc:
 *                     type: array
 *                     items:
 *                       type: boolean
 *                     example: [true]
 *               project:
 *                 type: object
 *                 example: { "_id": 1, "date": 1, "area": 1, "liters": 1, "status": 1 }
 *               search:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     term:
 *                       type: string
 *                     fields:
 *                       type: array
 *                       items:
 *                         type: string
 *                     startsWith:
 *                       type: boolean
 *                     endsWith:
 *                       type: boolean
 *                 example: [{ "term": "Koramangala", "fields": ["area"], "startsWith": true }]
 *     responses:
 *       200:
 *         description: User history fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalCount:
 *                       type: number
 *                       example: 5
 *                     tableData:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             example: "2026-02-14T10:00:00Z"
 *                           area:
 *                             type: string
 *                             example: "Koramangala"
 *                           liters:
 *                             type: string
 *                             example: "100L"
 *                           status:
 *                             type: string
 *                             example: "Delivered"
 */
router.post(
    "/history",
    entryPoint,
    validate(getUserSlotHistorySchema),
    dbSelector,
    userAuthenticator,
    getUserSlotHistory,
    exitPoint
);

export default router;
