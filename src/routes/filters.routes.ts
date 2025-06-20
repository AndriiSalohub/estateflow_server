import { Router } from "express";
import {
  getPriceRange,
  getAreaRange,
  getRooms,
  getTransactionTypes,
  getPropertyTypes,
} from "../controllers/filters.controller";

const router = Router();

/**
 * @swagger
 * /api/filters/price-range:
 *   get:
 *     summary: Get price range for properties
 *     description: Retrieves the minimum and maximum price of properties available in the database.
 *     tags: [Filters]
 *     responses:
 *       200:
 *         description: Successfully retrieved price range
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 minPrice:
 *                   type: number
 *                   example: 100000
 *                 maxPrice:
 *                   type: number
 *                   example: 500000
 *               required:
 *                 - minPrice
 *                 - maxPrice
 *       404:
 *         description: No valid price range data found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: No valid price range data found
 *               required:
 *                 - message
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal server error
 *               required:
 *                 - message
 */
router.get("/price-range", getPriceRange);

/**
 * @swagger
 * /api/filters/area-range:
 *   get:
 *     summary: Get area range for properties
 *     description: Retrieves the minimum and maximum area (size) of properties available in the database.
 *     tags: [Filters]
 *     responses:
 *       200:
 *         description: Successfully retrieved area range
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 minArea:
 *                   type: number
 *                   example: 50
 *                 maxArea:
 *                   type: number
 *                   example: 200
 *               required:
 *                 - minArea
 *                 - maxArea
 *       404:
 *         description: No valid area range data found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: No valid area range data found
 *               required:
 *                 - message
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal server error
 *               required:
 *                 - message
 */
router.get("/area-range", getAreaRange);

/**
 * @swagger
 * /api/filters/rooms:
 *   get:
 *     summary: Get available room counts
 *     description: Retrieves a sorted list of unique room counts for properties in the database.
 *     tags: [Filters]
 *     responses:
 *       200:
 *         description: Successfully retrieved rooms data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 rooms:
 *                   type: array
 *                   items:
 *                     type: number
 *                   example: [1, 2, 3, 4]
 *               required:
 *                 - rooms
 *       404:
 *         description: No valid rooms data found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: No valid rooms data found
 *               required:
 *                 - message
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal server error
 *               required:
 *                 - message
 */
router.get("/rooms", getRooms);

/**
 * @swagger
 * /api/filters/transaction-types:
 *   get:
 *     summary: Get available transaction types
 *     description: Retrieves a list of unique transaction types for properties in the database.
 *     tags: [Filters]
 *     responses:
 *       200:
 *         description: Successfully retrieved transaction types
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transactionTypes:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["sale", "rent"]
 *               required:
 *                 - transactionTypes
 *       404:
 *         description: No valid transaction types data found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: No valid transaction types data found
 *               required:
 *                 - message
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal server error
 *               required:
 *                 - message
 */
router.get("/transaction-types", getTransactionTypes);

/**
 * @swagger
 * /api/filters/property-types:
 *   get:
 *     summary: Get available property types
 *     description: Retrieves a list of unique property types for properties in the database.
 *     tags: [Filters]
 *     responses:
 *       200:
 *         description: Successfully retrieved property types
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 propertyTypes:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["apartment", "house", "condo"]
 *               required:
 *                 - propertyTypes
 *       404:
 *         description: No valid property types data found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: No valid property types data found
 *               required:
 *                 - message
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal server error
 *               required:
 *                 - message
 */
router.get("/property-types", getPropertyTypes);

export default router;
