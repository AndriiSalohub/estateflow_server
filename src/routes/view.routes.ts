import { Router } from "express";
import { viewProperty } from "../controllers/view.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * /api/views:
 *   post:
 *     summary: Record a property view
 *     description: Records a view of a property by an authenticated user. Updates the view timestamp if the user has previously viewed the property, or creates a new view record if not.
 *     tags: [Views]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - propertyId
 *             properties:
 *               propertyId:
 *                 type: string
 *                 description: The ID of the property being viewed
 *                 example: "prop_12345"
 *     responses:
 *       200:
 *         description: Property view recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Property view recorded successfully"
 *       400:
 *         description: Bad Request - propertyId is missing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Bad Request: propertyId is required"
 *       401:
 *         description: Unauthorized - User ID not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized: User ID not found"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal Server Error"
 */
router.post("/", authMiddleware, viewProperty);

export default router;
