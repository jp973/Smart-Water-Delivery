import { Router } from "express";
import { entryPoint } from "../../../middleware/entryPoint";
import { exitPoint } from "../../../middleware/exitPoint";
import { dbSelector } from "../../../middleware/dbSelector";
import { validate } from "../../../middleware/zodValidator";
import { adminAuthenticator } from "../../../middleware/authenticator";
import {
    createSlotSchema,
    updateSlotSchema,
    getSlotByIdSchema,
    getAllSlotSchema,
} from "../../../schemas/v1/slot";
import {
    createSlot,
    updateSlot,
    deleteSlot,
    getSlotById,
    getAllSlot,
} from "../../../controller/v1/admin/slot";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Slots
 *   description: Slot management APIs
 */

/**
 * @swagger
 * /v1/admin/slot/create:
 *   post:
 *     summary: Create a new slot
 *     tags: [Admin/Slots]
 *     security:
 *       - adminBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - startTime
 *               - endTime
 *               - areaId
 *               - capacity
 *               - bookingCutoffTime
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2024-03-20"
 *               startTime:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-03-20T10:00:00.000Z"
 *               endTime:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-03-20T11:00:00.000Z"
 *               areaId:
 *                 type: string
 *                 example: "60d5ecb8b5c9c62b3c7c1b5e"
 *               capacity:
 *                 type: integer
 *                 example: 10
 *               bookingCutoffTime:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-03-20T08:00:00.000Z"
 *     responses:
 *       201:
 *         description: Slot created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 201
 *                 message:
 *                   type: string
 *                   example: "Slot created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "60d5ecb8b5c9c62b3c7c1b5e"
 *                 toastMessage:
 *                   type: string
 *                   example: "Slot created successfully"
 *       500:
 *         description: Internal server error
 */
router.post(
    "/create",
    entryPoint,
    dbSelector,
    adminAuthenticator,
    validate(createSlotSchema),
    createSlot,
    exitPoint,
);

/**
 * @swagger
 * /v1/admin/slot/update/{id}:
 *   put:
 *     summary: Update an existing slot
 *     tags: [Admin/Slots]
 *     security:
 *       - adminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Slot ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2024-03-20"
 *               startTime:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-03-20T10:30:00.000Z"
 *               endTime:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-03-20T11:30:00.000Z"
 *               capacity:
 *                 type: integer
 *                 example: 15
 *               bookingCutoffTime:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-03-20T08:00:00.000Z"
 *               status:
 *                 type: string
 *                 enum: ["Available", "Full", "Closed"]
 *                 example: "Available"
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Slot updated successfully
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
 *                   example: "Slot updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "60d5ecb8b5c9c62b3c7c1b5e"
 *                     date:
 *                       type: string
 *                       example: "2024-03-20T00:00:00.000Z"
 *                     startTime:
 *                       type: string
 *                       example: "2024-03-20T10:30:00.000Z"
 *                     endTime:
 *                       type: string
 *                       example: "2024-03-20T11:30:00.000Z"
 *                     areaId:
 *                       type: string
 *                       example: "60d5ecb8b5c9c62b3c7c1b5e"
 *                     capacity:
 *                       type: integer
 *                       example: 15
 *                     bookingCutoffTime:
 *                       type: string
 *                       example: "2024-03-20T08:00:00.000Z"
 *                     status:
 *                       type: string
 *                       example: "Available"
 *                     isActive:
 *                       type: boolean
 *                       example: true
 *                     isDeleted:
 *                       type: boolean
 *                       example: false
 *                     createdAt:
 *                       type: string
 *                       example: "2024-12-01T12:34:56.789Z"
 *                     updatedAt:
 *                       type: string
 *                       example: "2024-12-10T09:30:45.123Z"
 *                 toastMessage:
 *                   type: string
 *                   example: "Slot updated successfully"
 *       404:
 *         description: Slot not found
 *       500:
 *         description: Internal server error
 */
router.put(
    "/update/:id",
    entryPoint,
    dbSelector,
    adminAuthenticator,
    validate(updateSlotSchema),
    updateSlot,
    exitPoint,
);

/**
 * @swagger
 * /v1/admin/slot/delete/{id}:
 *   delete:
 *     summary: Soft delete a slot
 *     tags: [Admin/Slots]
 *     security:
 *       - adminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Slot ID
 *     responses:
 *       200:
 *         description: Slot deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: string
 *                   example: "Slot deleted successfully"
 *                 toastMessage:
 *                   type: string
 *                   example: "Slot deleted successfully"
 *       404:
 *         description: Slot not found
 *       500:
 *         description: Internal server error
 */
router.delete(
    "/delete/:id",
    entryPoint,
    dbSelector,
    adminAuthenticator,
    validate(getSlotByIdSchema),
    deleteSlot,
    exitPoint,
);

/**
 * @swagger
 * /v1/admin/slot/get/{id}:
 *   get:
 *     summary: Get slot by ID
 *     tags: [Admin/Slots]
 *     security:
 *       - adminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Slot ID
 *     responses:
 *       200:
 *         description: Slot fetched successfully
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
 *                   example: "Slot fetched successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "60d5ecb8b5c9c62b3c7c1b5e"
 *                     date:
 *                       type: string
 *                       example: "2024-03-20T00:00:00.000Z"
 *                     startTime:
 *                       type: string
 *                       example: "2024-03-20T10:00:00.000Z"
 *                     endTime:
 *                       type: string
 *                       example: "2024-03-20T11:00:00.000Z"
 *                     areaId:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: "698e06ddd2753dd70a8ef994"
 *                         name:
 *                           type: string
 *                           example: "North Sector"
 *                         description:
 *                           type: string
 *                           example: "Residential area in the north"
 *                         city:
 *                           type: string
 *                           example: "Ahmedabad"
 *                         pincode:
 *                           type: string
 *                           example: "380015"
 *                     capacity:
 *                       type: integer
 *                       example: 500
 *                     bookingCutoffTime:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-03-20T08:00:00.000Z"
 *                     currentBookingsCount:
 *                       type: integer
 *                       example: 0
 *                     status:
 *                       type: string
 *                       example: "Available"
 *                     isActive:
 *                       type: boolean
 *                       example: true
 *                     isDeleted:
 *                       type: boolean
 *                       example: false
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-02-13T13:26:18.471Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-02-13T13:26:18.471Z"
 *                 toastMessage:
 *                   type: string
 *                   nullable: true
 *                   example: null
 *       404:
 *         description: Slot not found
 *       500:
 *         description: Internal server error
 */
router.get(
    "/get/:id",
    entryPoint,
    dbSelector,
    adminAuthenticator,
    validate(getSlotByIdSchema),
    getSlotById,
    exitPoint,
);

/**
 * @swagger
 * /v1/admin/slot/getAll:
 *   post:
 *     summary: Get all slots with filters, pagination, and search
 *     tags: [Admin/Slots]
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
 *                 example: { "status": "Available" }
 *               options:
 *                 type: object
 *                 properties:
 *                   page:
 *                     type: integer
 *                     example: 1
 *                   itemsPerPage:
 *                     type: integer
 *                     example: 10
 *                   sortBy:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["date"]
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
 *                       example: "2024"
 *                     fields:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["date"]
 *               project:
 *                 type: object
 *                 example: { "date": 1, "startTime": 1, "endTime": 1, "capacity": 1, "status": 1, "bookingCutoffTime": 1 }
 *     responses:
 *       200:
 *         description: Slots fetched successfully
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
 *                   example: "Slots fetched successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalCount:
 *                       type: integer
 *                       example: 3
 *                     tableData:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "698f27954a89fa797309147a"
 *                           date:
 *                             type: string
 *                             format: date-time
 *                             example: "2026-02-14T00:00:00.000Z"
 *                           startTime:
 *                             type: string
 *                             format: date-time
 *                             example: "2026-02-14T15:00:00.000Z"
 *                           endTime:
 *                             type: string
 *                             format: date-time
 *                             example: "2026-02-14T18:00:00.000Z"
 *                           areaId:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                                 example: "698e06ddd2753dd70a8ef994"
 *                               name:
 *                                 type: string
 *                                 example: "North Sector"
 *                               description:
 *                                 type: string
 *                                 example: "Residential area in the north"
 *                               city:
 *                                 type: string
 *                                 example: "Ahmedabad"
 *                               pincode:
 *                                 type: string
 *                                 example: "380015"
 *                           capacity:
 *                             type: integer
 *                             example: 400
 *                           currentBookingsCount:
 *                             type: integer
 *                             example: 0
 *                           bookingCutoffTime:
 *                             type: string
 *                             format: date-time
 *                             example: "2026-02-14T14:00:00.000Z"
 *                           status:
 *                             type: string
 *                             example: "Available"
 *                           isActive:
 *                             type: boolean
 *                             example: true
 *                           isDeleted:
 *                             type: boolean
 *                             example: false
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2026-02-13T13:31:01.678Z"
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2026-02-13T13:31:01.678Z"
 *                 toastMessage:
 *                   type: string
 *                   nullable: true
 *                   example: null
 *       500:
 *         description: Internal server error
 */
router.post(
    "/getAll",
    entryPoint,
    dbSelector,
    adminAuthenticator,
    validate(getAllSlotSchema),
    getAllSlot,
    exitPoint,
);

export default router;
