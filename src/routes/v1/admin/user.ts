import { Router } from "express";
import {
    createUser,
    updateUser,
    deleteUser,
    getUserById,
    getAllUsers,
} from "../../../controller/v1/admin/user";
import {
    createUserSchema,
    updateUserSchema,
    deleteUserSchema,
    getUserByIdSchema,
    getAllUserSchema,
} from "../../../schemas/v1/user";
import { validate } from "../../../middleware/zodValidator";
import { entryPoint } from "../../../middleware/entryPoint";
import { exitPoint } from "../../../middleware/exitPoint";
import { dbSelector } from "../../../middleware/dbSelector";
import { adminAuthenticator } from "../../../middleware/authenticator";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management for admins
 */

/**
 * @swagger
 * /v1/admin/user/create:
 *   post:
 *     summary: Create a new user
 *     tags: [Admin/Users]
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
 *               - email
 *               - password
 *               - phone
 *               - countryCode
 *               - address
 *               - waterQuantity
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               phone:
 *                 type: string
 *               countryCode:
 *                 type: string
 *               address:
 *                 type: object
 *                 properties:
 *                   houseNo:
 *                     type: string
 *                   street:
 *                     type: string
 *                   area:
 *                     type: string
 *                   city:
 *                     type: string
 *                   pincode:
 *                     type: string
 *                   landmark:
 *                     type: string
 *               waterQuantity:
 *                 type: number
 *               notes:
 *                 type: string
 *           example:
 *             name: "John Doe"
 *             phone: "9876543210"
 *             email: "user@example.com"
 *             password: "User@123"
 *             countryCode: "91"
 *             address:
 *               houseNo: "123"
 *               street: "Main St"
 *               area: "64d2fa92e5b5f7765e4e13a2"
 *               city: "Ahmedabad"
 *               pincode: "380009"
 *               landmark: "Near Park"
 *             waterQuantity: 30
 *             notes: "Special instructions"
 *     responses:
 *       201:
 *         description: User created successfully
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
    "/create",
    entryPoint,
    dbSelector,
    adminAuthenticator,
    validate(createUserSchema),
    createUser,
    exitPoint,
);

/**
 * @swagger
 * /v1/admin/user/update/{id}:
 *   put:
 *     summary: Update an existing user
 *     tags: [Admin/Users]
 *     security:
 *       - adminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               phone:
 *                 type: string
 *               countryCode:
 *                 type: string
 *               address:
 *                 type: object
 *               waterQuantity:
 *                 type: number
 *               notes:
 *                 type: string
 *               isEnabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *                 toastMessage:
 *                   type: string
 *                   example: "User updated successfully"
 *       404:
 *         description: User not found
 */
router.put(
    "/update/:id",
    entryPoint,
    dbSelector,
    adminAuthenticator,
    validate(updateUserSchema),
    updateUser,
    exitPoint,
);

/**
 * @swagger
 * /v1/admin/user/delete/{id}:
 *   delete:
 *     summary: Soft delete a user
 *     tags: [Admin/Users]
 *     security:
 *       - adminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 */
router.delete(
    "/delete/:id",
    entryPoint,
    dbSelector,
    adminAuthenticator,
    validate(deleteUserSchema),
    deleteUser,
    exitPoint,
);

/**
 * @swagger
 * /v1/admin/user/get/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Admin/Users]
 *     security:
 *       - adminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User fetched successfully
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
 *                   example: "User fetched successfully"
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
 *                       example: "Morning delivery preferred"
 *                     lastDeliveryDate:
 *                       type: string
 *                       example: "2026-02-14T10:46:03.854Z"
 *                     areaId:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         description:
 *                           type: string
 *                         city:
 *                           type: string
 *                         pincode:
 *                           type: string
 *                 toastMessage:
 *                   type: string
 *                   nullable: true
 */
router.get(
    "/get/:id",
    entryPoint,
    dbSelector,
    adminAuthenticator,
    validate(getUserByIdSchema),
    getUserById,
    exitPoint,
);

/**
 * @swagger
 * /v1/admin/user/getAll:
 *   post:
 *     summary: Get all users with search, sort, and pagination
 *     tags: [Admin/Users]
 *     security:
 *       - adminBearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               options:
 *                 type: object
 *                 properties:
 *                   page:
 *                     type: integer
 *                   itemsPerPage:
 *                     type: integer
 *                   sortBy:
 *                     type: array
 *                     items:
 *                       type: string
 *                   sortDesc:
 *                     type: array
 *                     items:
 *                       type: boolean
 *               project:
 *                 type: object
 *               filters:
 *                 type: object
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
 *               areaId:
 *                 type: string
 *                 description: Filter users by area ID
 *           example:
 *             options:
 *               page: 1
 *               itemsPerPage: 10
 *               sortBy: ["createdAt"]
 *               sortDesc: [true]
 *             project:
 *               _id: 1
 *               name: 1
 *             filters:
 *               isEnabled: true
 *               waterQuantity: 20
 *             search:
 *               - term: ""
 *                 fields: ["name"]
 *                 startsWith: true
 *                 endsWith: false
 *             areaId: "698e06ddd2753dd70a8ef994"
 *     responses:
 *       200:
 *         description: Users fetched successfully
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
 *                   example: "Users fetched successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalCount:
 *                       type: integer
 *                       example: 6
 *                     tableData:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "698f7dcfa9b153542b31e653"
 *                           name:
 *                             type: string
 *                             example: "jayyu"
 *                           phone:
 *                             type: string
 *                             example: "7338198918"
 *                           countryCode:
 *                             type: string
 *                             example: "91"
 *                           address:
 *                             type: object
 *                             properties:
 *                               houseNo:
 *                                 type: string
 *                                 example: "123"
 *                               street:
 *                                 type: string
 *                                 example: "Main St"
 *                               area:
 *                                 type: string
 *                                 example: "698e06ddd2753dd70a8ef994"
 *                               city:
 *                                 type: string
 *                                 example: "Ahmedabad"
 *                               pincode:
 *                                 type: string
 *                                 example: "380009"
 *                               landmark:
 *                                 type: string
 *                                 example: "Near Park"
 *                           waterQuantity:
 *                             type: number
 *                             example: 40
 *                           notes:
 *                             type: string
 *                             example: "Special instructions"
 *                           lastDeliveryDate:
 *                             type: string
 *                             example: "2026-02-14T10:46:03.854Z"
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
 *                 toastMessage:
 *                   type: string
 *                   nullable: true
 */
router.post(
    "/getAll",
    entryPoint,
    dbSelector,
    adminAuthenticator,
    validate(getAllUserSchema),
    getAllUsers,
    exitPoint,
);

export default router;
