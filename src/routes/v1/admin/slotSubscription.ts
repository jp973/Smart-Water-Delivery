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
    getTodaySlots,
} from "../../../controller/v1/admin/slotSubscription";
import {
    getPendingExtraRequestsSchema,
    updateExtraRequestStatusSchema,
    updateSubscriptionStatusSchema,
    getTodaySlotsSchema,
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
 * /v1/admin/dashboard/pendingExtraRequests:
 *   post:
 *     summary: Get all pending extra quantity requests
 *     tags: [Admin/Dashboard]
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
 *                       capacity: 500
 *                       currentBookingsCount: 0
 *                       bookingCutoffTime: "2026-02-14T16:00:00.000Z"
 *                       status: "Available"
 *                     quantity: 40
 *                     status: "Delivered"
 *                     extraQuantity: 20
 *                     extraRequestStatus: "Pending"
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
 * /v1/admin/dashboard/getTodaySlots:
 *   post:
 *     summary: Get all slots for today with booking progress
 *     tags: [Admin/Dashboard]
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
 *                     example: ["startTime"]
 *                   sortDesc:
 *                     type: array
 *                     items:
 *                       type: boolean
 *                     example: [false]
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
 *                 example: [{ "term": "Kora", "fields": ["area"], "startsWith": true, "endsWith": false }]
 *               project:
 *                 type: object
 *                 example: { "capacity": 1, "customerBookedLiter": 1 }
 *     responses:
 *       200:
 *         description: Today's slots fetched successfully
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
 *                     totalLitersToday:
 *                       type: string
 *                     totalCustomer:
 *                       type: string
 *                     tableData:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           date:
 *                             type: string
 *                           startTime:
 *                             type: string
 *                           endTime:
 *                             type: string
 *                           capacity:
 *                             type: number
 *                           customerBookedLiter:
 *                             type: number
 *                           progressPercentage:
 *                             type: string
 *                           allotted:
 *                             type: number
 *                           area:
 *                             type: object
 *             example:
 *               isSuccess: true
 *               status: 200
 *               message: "Today's slots fetched successfully"
 *               data:
 *                 totalCount: 1
 *                 totalLitersToday: "2,400"
 *                 totalCustomer: "48"
 *                 tableData:
 *                   - _id: "69903b2d2a8d7e1dae1d2783"
 *                     date: "2026-02-14T00:00:00.000Z"
 *                     startTime: "2026-02-14T08:00:00.000Z"
 *                     endTime: "2026-02-14T10:00:00.000Z"
 *                     capacity: 500
 *                     customerBookedLiter: 400
 *                     progressPercentage: "80"
 *                     allotted: 4
 *                     area:
 *                       _id: "698e06ddd2753dd70a8ef994"
 *                       name: "Koramangala"
 */
router.post(
    "/getTodaySlots",
    entryPoint,
    validate(getTodaySlotsSchema),
    dbSelector,
    adminAuthenticator,
    getTodaySlots,
    exitPoint
);

/**
 * @swagger
 * /v1/admin/dashboard/updateRequestStatus/{id}:
 *   put:
 *     summary: Approve or reject an extra quantity request
 *     tags: [Admin/Dashboard]
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
    "/updateRequestStatus/:id",
    entryPoint,
    validate(updateExtraRequestStatusSchema),
    dbSelector,
    adminAuthenticator,
    updateExtraRequestStatus,
    exitPoint
);

/**
 * @swagger
 * /v1/admin/dashboard/updateDeliveryStatus/{id}:
 *   put:
 *     summary: Update delivery status (Delivered or Missed)
 *     tags: [Admin/Dashboard]
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
    "/updateDeliveryStatus/:id",
    entryPoint,
    validate(updateSubscriptionStatusSchema),
    dbSelector,
    adminAuthenticator,
    updateSubscriptionStatus,
    exitPoint
);

export default router;
