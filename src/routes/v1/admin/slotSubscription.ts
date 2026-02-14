import { Router } from "express";
import { entryPoint } from "../../../middleware/entryPoint";
import { exitPoint } from "../../../middleware/exitPoint";
import { dbSelector } from "../../../middleware/dbSelector";
import { validate } from "../../../middleware/zodValidator";
import { adminAuthenticator } from "../../../middleware/authenticator";
import {
    getPendingExtraRequests,
    updateExtraRequestStatus,
    updateSubscriptionStatus,
} from "../../../controller/v1/admin/slotSubscription";
import {
    getPendingExtraRequestsSchema,
    updateExtraRequestStatusSchema,
    updateSubscriptionStatusSchema,
} from "../../../schemas/v1/slot";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Admin Slot Subscription
 *   description: Management of user slot subscriptions and extra requests
 */

/**
 * @swagger
 * /v1/admin/slotSubscription/pendingExtraRequests:
 *   post:
 *     summary: Get all pending extra quantity requests
 *     tags: [Admin/SlotSubscription]
 *     security:
 *       - adminBearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               filters:
 *                 type: object
 *                 example: {}
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
 *                 example: [{ "term": "99", "fields": ["phone"], "startsWith": false, "endsWith": false }]
 *               project:
 *                 type: object
 *                 example: { "customerId": 1, "extraQuantity": 1, "createdAt": 1 }
 *     responses:
 *       200:
 *         description: Pending requests fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isSuccess:
 *                   type: boolean
 *                 status:
 *                   type: number
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalCount:
 *                       type: number
 *                     tableData:
 *                       type: array
 *                       items:
 *                         type: object
 *                 toastMessage:
 *                   type: string
 *                   nullable: true
 *             example:
 *               status: 200
 *               message: "Pending extra requests fetched successfully"
 *               data:
 *                 totalCount: 1
 *                 tableData:
 *                   - _id: "69903b2d2a8d7e1dae1d278b"
 *                     customerId:
 *                       _id: "698f7dcfa9b153542b31e653"
 *                       name: "jayyu"
 *                       phone: "7338198918"
 *                       countryCode: "91"
 *                       address:
 *                         houseNo: "123"
 *                         street: "Main St"
 *                         area: "698e06ddd2753dd70a8ef994"
 *                         city: "Ahmedabad"
 *                         pincode: "380009"
 *                         landmark: "Near Park"
 *                       waterQuantity: 40
 *                       notes: "Special instructions"
 *                       isEnabled: true
 *                       isVerified: false
 *                       isDeleted: false
 *                       createdAt: "2026-02-13T19:38:55.862Z"
 *                       updatedAt: "2026-02-13T19:38:55.862Z"
 *                     slotId:
 *                       _id: "69903b2d2a8d7e1dae1d2783"
 *                       date: "2026-02-14T00:00:00.000Z"
 *                       startTime: "2026-02-14T18:00:00.000Z"
 *                       endTime: "2026-02-14T20:00:00.000Z"
 *                       areaId:
 *                         _id: "698e06ddd2753dd70a8ef994"
 *                         name: "North Sector"
 *                         description: "Residential area in the north"
 *                         city: "Ahmedabad"
 *                         pincode: "380015"
 *                         isDeleted: true
 *                         createdAt: "2026-02-12T16:59:09.066Z"
 *                         updatedAt: "2026-02-12T17:18:31.885Z"
 *                       capacity: 500
 *                       currentBookingsCount: 0
 *                       bookingCutoffTime: "2026-02-14T16:00:00.000Z"
 *                       status: "Available"
 *                       isActive: true
 *                       isDeleted: false
 *                       createdAt: "2026-02-14T09:06:53.861Z"
 *                       updatedAt: "2026-02-14T09:06:53.861Z"
 *                     quantity: 40
 *                     status: "Delivered"
 *                     extraQuantity: 20
 *                     extraRequestStatus: "Pending"
 *                     isActive: true
 *                     isDeleted: false
 *                     createdAt: "2026-02-14T09:06:53.913Z"
 *                     updatedAt: "2026-02-14T11:57:16.144Z"
 *                     deliveredAt: "2026-02-14T10:46:03.854Z"
 *               toastMessage: null
 */
router.post(
    "/pendingExtraRequests",
    entryPoint,
    validate(getPendingExtraRequestsSchema),
    dbSelector,
    adminAuthenticator,
    getPendingExtraRequests,
    exitPoint
);

/**
 * @swagger
 * /v1/admin/slot-subscription/update-extra-request-status/{id}:
 *   put:
 *     summary: Approve or reject an extra quantity request
 *     tags: [Admin/SlotSubscription]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subscription ID
 *     security:
 *       - adminBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Approved, Rejected]
 *     responses:
 *       200:
 *         description: Request updated successfully
 *       404:
 *         description: Subscription not found
 */
router.put(
    "/update-extra-request-status/:id",
    entryPoint,
    validate(updateExtraRequestStatusSchema),
    dbSelector,
    adminAuthenticator,
    updateExtraRequestStatus,
    exitPoint
);

/**
 * @swagger
 * /v1/admin/slot-subscription/update-delivery-status/{id}:
 *   put:
 *     summary: Update delivery status (Delivered or Missed)
 *     tags: [Admin/SlotSubscription]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subscription ID
 *     security:
 *       - adminBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Delivered, Missed]
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       404:
 *         description: Subscription not found
 */
router.put(
    "/update-delivery-status/:id",
    entryPoint,
    validate(updateSubscriptionStatusSchema),
    dbSelector,
    adminAuthenticator,
    updateSubscriptionStatus,
    exitPoint
);

export default router;
