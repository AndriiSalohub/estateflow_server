import { Router } from "express";
import {
  getUserWishlist,
  postWishlistItem,
  deleteWishlistItem,
} from "../controllers/wishlist.controller";
import { RequestHandler } from "express";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /api/wishlist:
 *   get:
 *     summary: Get user's wishlist with property details and images
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of properties in user's wishlist
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   ownerId:
 *                     type: string
 *                   isVerified:
 *                     type: boolean
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *                   facilities:
 *                     type: string
 *                   propertyType:
 *                     type: string
 *                     enum: [house, apartment]
 *                   transactionType:
 *                     type: string
 *                     enum: [sale, rent]
 *                   price:
 *                     type: number
 *                     format: double
 *                   currency:
 *                     type: string
 *                   size:
 *                     type: number
 *                   rooms:
 *                     type: integer
 *                   address:
 *                     type: string
 *                   status:
 *                     type: string
 *                     enum: [active, inactive, sold, rented]
 *                   documentUrl:
 *                     type: string
 *                   verificationComments:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                   images:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Array of image URLs (primary image first)
 *                   views:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                           description: Unique identifier for the view
 *                         propertyId:
 *                           type: string
 *                           format: uuid
 *                           description: ID of the property associated with the view
 *                     description: Array of view objects for the property
 *       401:
 *         description: Unauthorized
 */
router.get("/", getUserWishlist);

/**
 * @swagger
 * /api/wishlist:
 *   post:
 *     summary: Add an item to user wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Property ID to add
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
 *                 example: "property-456"
 *     responses:
 *       201:
 *         description: Item added to wishlist
 *       400:
 *         description: Missing propertyId in request body
 *       409:
 *         description: Item already in wishlist
 *       401:
 *         description: Unauthorized
 */
router.post("/", postWishlistItem as RequestHandler);

/**
 * @swagger
 * /api/wishlist/{propertyId}:
 *   delete:
 *     summary: Remove an item from user wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: propertyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Property ID to remove from wishlist
 *     responses:
 *       200:
 *         description: Item removed from wishlist
 *       400:
 *         description: Missing propertyId in path parameters
 *       401:
 *         description: Unauthorized
 */
router.delete("/:propertyId", deleteWishlistItem as RequestHandler);

export default router;
