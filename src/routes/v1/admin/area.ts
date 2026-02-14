import { Router } from "express";
import { entryPoint } from "../../../middleware/entryPoint";
import { exitPoint } from "../../../middleware/exitPoint";
import { dbSelector } from "../../../middleware/dbSelector";
import { validate } from "../../../middleware/zodValidator";
import { adminAuthenticator } from "../../../middleware/authenticator";
import {
    createAreaSchema,
    updateAreaSchema,
    getAreaByIdSchema,
    getAllAreaSchema,
} from "../../../schemas/v1/area";
import {
    createArea,
    updateArea,
    deleteArea,
    getAreaById,
    getAllArea,
} from "../../../controller/v1/admin/area";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Areas
 *   description: Area management APIs
 */

/**
 * @swagger
 * /v1/admin/area/create:
 *   post:
 *     summary: Create a new area
 *     tags: [Admin/Areas]
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
 *                 example: "North Sector"
 *               description:
 *                 type: string
 *                 example: "Residential area in the north"
 *               city:
 *                 type: string
 *                 example: "Ahmedabad"
 *               pincode:
 *                 type: string
 *                 example: "380015"
 *     responses:
 *       201:
 *         description: Area created successfully
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
 *                   example: "Area created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "60d5ecb8b5c9c62b3c7c1b5e"
 *                 toastMessage:
 *                   type: string
 *                   example: "Area created successfully"
 *       500:
 *         description: Internal server error
 */
router.post(
    "/create",
    entryPoint,
    dbSelector,
    adminAuthenticator,
    validate(createAreaSchema),
    createArea,
    exitPoint,
);

/**
 * @swagger
 * /v1/admin/area/update/{id}:
 *   put:
 *     summary: Update an existing area
 *     tags: [Admin/Areas]
 *     security:
 *       - adminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Area ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated North Sector"
 *               description:
 *                 type: string
 *                 example: "Updated description"
 *               city:
 *                 type: string
 *                 example: "Ahmedabad"
 *               pincode:
 *                 type: string
 *                 example: "380015"
 *     responses:
 *       200:
 *         description: Area updated successfully
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
 *                   example: "Area updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "60d5ecb8b5c9c62b3c7c1b5e"
 *                     name:
 *                       type: string
 *                       example: "Updated North Sector"
 *                     description:
 *                       type: string
 *                       example: "Updated description"
 *                     city:
 *                       type: string
 *                       example: "Ahmedabad"
 *                     pincode:
 *                       type: string
 *                       example: "380015"
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
 *                   example: "Area updated successfully"
 *       404:
 *         description: Area not found
 *       500:
 *         description: Internal server error
 */
router.put(
    "/update/:id",
    entryPoint,
    dbSelector,
    adminAuthenticator,
    validate(updateAreaSchema),
    updateArea,
    exitPoint,
);

/**
 * @swagger
 * /v1/admin/area/delete/{id}:
 *   delete:
 *     summary: Soft delete an area
 *     tags: [Admin/Areas]
 *     security:
 *       - adminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Area ID
 *     responses:
 *       200:
 *         description: Area deleted successfully
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
 *                   example: "Area deleted successfully"
 *                 toastMessage:
 *                   type: string
 *                   example: "Area deleted successfully"
 *       404:
 *         description: Area not found
 *       500:
 *         description: Internal server error
 */
router.delete(
    "/delete/:id",
    entryPoint,
    dbSelector,
    adminAuthenticator,
    validate(getAreaByIdSchema),
    deleteArea,
    exitPoint,
);

/**
 * @swagger
 * /v1/admin/area/get/{id}:
 *   get:
 *     summary: Get area by ID
 *     tags: [Admin/Areas]
 *     security:
 *       - adminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Area ID
 *     responses:
 *       200:
 *         description: Area fetched successfully
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
 *                   example: "Area fetched successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "698e06ddd2753dd70a8ef994"
 *                     name:
 *                       type: string
 *                       example: "North Sector"
 *                     description:
 *                       type: string
 *                       example: "Residential area in the north"
 *                     city:
 *                       type: string
 *                       example: "Ahmedabad"
 *                     pincode:
 *                       type: string
 *                       example: "380015"
 *                     isDeleted:
 *                       type: boolean
 *                       example: false
 *                     createdAt:
 *                       type: string
 *                       example: "2026-02-12T16:59:09.066Z"
 *                     updatedAt:
 *                       type: string
 *                       example: "2026-02-12T16:59:09.066Z"
 *                 toastMessage:
 *                   type: string
 *                   nullable: true
 *                   example: null
 *       404:
 *         description: Area not found
 *       500:
 *         description: Internal server error
 */
router.get(
    "/get/:id",
    entryPoint,
    dbSelector,
    adminAuthenticator,
    validate(getAreaByIdSchema),
    getAreaById,
    exitPoint,
);

/**
 * @swagger
 * /v1/admin/area/getAll:
 *   post:
 *     summary: Get all areas with filters, pagination, and search
 *     tags: [Admin/Areas]
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
 *                 example: { "city": "Ahmedabad" }
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
 *                       example: "North"
 *                     fields:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["name", "city", "pincode"]
 *                     startsWith:
 *                       type: boolean
 *                       example: true
 *                     endsWith:
 *                       type: boolean
 *                       example: false
 *               project:
 *                 type: object
 *                 example: { "name": 1, "description": 1, "city": 1, "pincode": 1 }
 *     responses:
 *       200:
 *         description: Areas fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 200
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
 *                             example: "64d2fa92e5b5f7765e4e13a2"
 *                           name:
 *                             type: string
 *                             example: "North Sector"
 *                           description:
 *                             type: string
 *                             example: "Residential area in the north"
 *                           city:
 *                             type: string
 *                             example: "Ahmedabad"
 *                           pincode:
 *                             type: string
 *                             example: "380015"
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
    validate(getAllAreaSchema),
    getAllArea,
    exitPoint,
);

export default router;
