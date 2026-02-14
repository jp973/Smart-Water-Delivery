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
