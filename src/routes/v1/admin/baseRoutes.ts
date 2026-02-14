import express from "express";
import { parseJson } from "../../../utils/v1/package";
import { swaggerUi, swaggerSpec } from "../../../swagger";

const router = express.Router();

/**
 * @swagger
 * /v1/ping:
 *   get:
 *     summary: Health check endpoint
 *     description: Simple endpoint to verify the API is running
 *     tags:
 *       - Base
 *     parameters:
 *       - $ref: '#/components/parameters/XDemoHeader'
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: pong
 */
router.get("/ping", (req, res) => {
  res.status(200).send({ message: "pong" });
});

/**
 * @swagger
 * /v1/version:
 *   get:
 *     summary: Get API version
 *     description: Returns the current version of the API
 *     tags:
 *       - Base
 *     parameters:
 *       - $ref: '#/components/parameters/XDemoHeader'
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 */
router.get("/version", (req, res) => {
  res.status(200).send({ version: parseJson.version });
});

/**
 * @swagger
 * /v1/test:
 *   get:
 *     summary: Test endpoint
 *     description: Tests if the API is working properly
 *     tags:
 *       - Base
 *     parameters:
 *       - $ref: '#/components/parameters/XDemoHeader'
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: All ok
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 */
router.use("/test", (req, res) => {
  res.json({ message: "All ok", version: parseJson.version });
});

router.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

export default router;
