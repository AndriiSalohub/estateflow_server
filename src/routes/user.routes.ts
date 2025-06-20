import { Router, RequestHandler } from "express";
import {
  addNewUser,
  deleteUser,
  getAllUsers,
  getUser,
  getUserById,
  updateUser,
  updateUserById,
} from "../controllers/user.controller";
import {
  requestChangeEmail,
  requestChangePassword,
  confirm_Change,
  requestPasswordResetHandler,
  resetPasswordHandler,
} from "../controllers/change_requests.controller";

import { authMiddleware } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/requireUserWithRole.middleware";

const router = Router();

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
 * /api/user:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: string
 *                 email:
 *                   type: string
 *                 username:
 *                   type: string
 *                 role:
 *                   type: string
 *                 avatarUrl:
 *                   type: string
 *                 bio:
 *                   type: string
 *                 isEmailVerified:
 *                   type: boolean
 *                 listingLimit:
 *                   type: integer
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized – token missing or invalid
 *       500:
 *         description: Internal server error
 */
router.get("/", authMiddleware, getUser);

/**
 * @swagger
 * /api/user/all:
 *   get:
 *     summary: Get all users
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved all users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   email:
 *                     type: string
 *                   username:
 *                     type: string
 *                   role:
 *                     type: string
 *                   avatarUrl:
 *                     type: string
 *                   bio:
 *                     type: string
 *                   isEmailVerified:
 *                     type: boolean
 *                   listingLimit:
 *                     type: integer
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized – token missing or invalid
 *       500:
 *         description: Internal server error
 */
router.get("/all", authMiddleware, getAllUsers);

/**
 * @swagger
 * /api/user/{userId}:
 *   patch:
 *     summary: Update user by ID
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               updatedInfo:
 *                 type: object
 *                 properties:
 *                   username:
 *                     type: string
 *                     example: "john_doe_updated"
 *                   avatarUrl:
 *                     type: string
 *                     format: uri
 *                     nullable: true
 *                     example: "https://example.com/new-avatar.jpg"
 *                   bio:
 *                     type: string
 *                     nullable: true
 *                     example: "Updated bio"
 *                   email:
 *                     type: string
 *                     format: email
 *                     example: "newemail@example.com"
 *                   role:
 *                     type: string
 *                     enum: [renter_buyer, private_seller, agency, moderator, admin]
 *                     example: "admin"
 *                   listingLimit:
 *                     type: integer
 *                     example: 10
 *     responses:
 *       200:
 *         description: Successfully updated user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "123e4567-e89b-12d3-a456-426614174000"
 *                 email:
 *                   type: string
 *                   example: "newemail@example.com"
 *                 username:
 *                   type: string
 *                   example: "john_doe_updated"
 *                 role:
 *                   type: string
 *                   example: "admin"
 *                 avatarUrl:
 *                   type: string
 *                   nullable: true
 *                   example: "https://example.com/new-avatar.jpg"
 *                 bio:
 *                   type: string
 *                   nullable: true
 *                   example: "Updated bio"
 *                 isEmailVerified:
 *                   type: boolean
 *                   example: true
 *                 listingLimit:
 *                   type: integer
 *                   example: 10
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-05-30T19:02:00Z"
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-05-31T13:21:00Z"
 *       400:
 *         description: Invalid input or email already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User with this email already exists"
 *       401:
 *         description: Unauthorized – token missing or invalid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */
router.patch("/:userId", requireRole(["admin"]), updateUserById);

/**
 * @swagger
 * /api/user:
 *   post:
 *     summary: Create a new user
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newUserInfo:
 *                 type: object
 *                 required:
 *                   - email
 *                   - username
 *                   - password
 *                   - role
 *                 properties:
 *                   email:
 *                     type: string
 *                     format: email
 *                     example: "newuser@example.com"
 *                   username:
 *                     type: string
 *                     example: "new_user"
 *                   password:
 *                     type: string
 *                     format: password
 *                     example: "SecurePassword123!"
 *                   role:
 *                     type: string
 *                     enum: [renter_buyer, private_seller, agency, moderator, admin]
 *                     example: "renter_buyer"
 *                   avatarUrl:
 *                     type: string
 *                     format: uri
 *                     nullable: true
 *                     example: "https://example.com/avatar.jpg"
 *                   bio:
 *                     type: string
 *                     nullable: true
 *                     example: "New user bio"
 *     responses:
 *       201:
 *         description: Successfully created user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "123e4567-e89b-12d3-a456-426614174000"
 *                 email:
 *                   type: string
 *                   example: "newuser@example.com"
 *                 username:
 *                   type: string
 *                   example: "new_user"
 *                 role:
 *                   type: string
 *                   example: "renter_buyer"
 *                 avatarUrl:
 *                   type: string
 *                   nullable: true
 *                   example: "https://example.com/avatar.jpg"
 *                 bio:
 *                   type: string
 *                   nullable: true
 *                   example: "New user bio"
 *                 isEmailVerified:
 *                   type: boolean
 *                   example: true
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-05-31T13:21:00Z"
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-05-31T13:21:00Z"
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Missing required fields"
 *       401:
 *         description: Unauthorized – token missing or invalid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized"
 *       409:
 *         description: User with this email already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "User with this email already exists"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
router.post("/", requireRole(["admin"]), addNewUser);

/**
 * @swagger
 * /api/user/{userId}:
 *   delete:
 *     summary: Delete user by ID
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to delete
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User deleted successfully"
 *       400:
 *         description: User ID is required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "User ID is required"
 *       401:
 *         description: Unauthorized – token missing or invalid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "User not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
router.delete("/:userId", requireRole(["admin"]), deleteUser);

/**
 * @swagger
 * /api/user/{userId}:
 *   get:
 *     summary: Get user by ID with their properties
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to retrieve
 *     responses:
 *       200:
 *         description: Successfully retrieved user with properties
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: string
 *                 email:
 *                   type: string
 *                 username:
 *                   type: string
 *                 role:
 *                   type: string
 *                 avatarUrl:
 *                   type: string
 *                 bio:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                 subscription:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: "active"
 *                     startDate:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-05-30T19:02:00Z"
 *                     endDate:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-06-29T19:02:00Z"
 *                     planName:
 *                       type: string
 *                       example: "Pro Plan"
 *                     planPrice:
 *                       type: number
 *                       example: 9.99
 *                     planCurrency:
 *                       type: string
 *                       example: "USD"
 *                 properties:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       status:
 *                         type: string
 *                       propertyType:
 *                         type: string
 *                         enum: [house, apartment]
 *                       transactionType:
 *                         type: string
 *                         enum: [sale, rent]
 *                       price:
 *                         type: number
 *                       currency:
 *                         type: string
 *                       size:
 *                         type: number
 *                       rooms:
 *                         type: integer
 *                       address:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                       images:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                            id:
 *                              type: string
 *                              example: "789e0123-e89b-12d3-a456-426614174000"
 *                            imageUrl:
 *                              type: string
 *                              example: "https://example.com/property-image.jpg"
 *                              isPrimary:
 *                                type: boolean
 *                                example: true
 *                              createdAt:
 *                                type: string
 *                                format: date-time
 *                                example: "2025-05-30T19:02:00Z"
 *       400:
 *         description: Bad Request – user ID is required
 *       401:
 *         description: Unauthorized – token missing or invalid
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get("/:userId", getUserById);

/**
 * @swagger
 * /api/user:
 *   patch:
 *     summary: Update current authenticated user
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               avatarUrl:
 *                 type: string
 *                 format: uri
 *               bio:
 *                 type: string
 *               paypalCredentials:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully updated user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 username:
 *                   type: string
 *                 avatarUrl:
 *                   type: string
 *                 bio:
 *                   type: string
 *                 paypalCredentials:
 *                   type: string
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.patch("/", authMiddleware, updateUser);

/**
 * @swagger
 * /api/user/request-email-change:
 *   post:
 *     summary: Request email change
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newEmail:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email change requested
 *       400:
 *         description: Invalid email
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/request-email-change",
  authMiddleware,
  requestChangeEmail as RequestHandler,
);

/**
 * @swagger
 * /api/user/request-password-change:
 *   post:
 *     summary: Request password change
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password change requested
 *       400:
 *         description: Invalid password
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/request-password-change",
  authMiddleware,
  requestChangePassword as RequestHandler,
);

/**
 * @swagger
 * /api/user/confirm-change/{token}/{type}:
 *   get:
 *     summary: Confirm email or password change
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Change confirmed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email changed successfully
 *                 email:
 *                   type: string
 *                   example: new@example.com
 *                   description: Present only for email change requests
 *       400:
 *         description: Invalid or expired token
 *       500:
 *         description: Server error
 */
router.get("/confirm-change/:token/:type", confirm_Change as RequestHandler);

/**
 * @swagger
 * /api/user/password-reset-request:
 *   post:
 *     summary: Request a password reset link
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: If the email exists, a reset link was sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Reset link sent if email exists
 *       400:
 *         description: Account with this email either does not exist, or an incorrect email was entered"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Account with this email either does not exist, or an incorrect email was entered"
 *       500:
 *         description: Internal server error
 */
router.post(
  "/password-reset-request",
  requestPasswordResetHandler as RequestHandler,
);

/**
 * @swagger
 * /api/user/password-reset:
 *   post:
 *     summary: Reset password with token
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *               password:
 *                 type: string
 *                 format: password
 *                 example: NewSecurePassword123!
 *     responses:
 *       200:
 *         description: Password successfully updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password updated successfully
 *       400:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid or expired token
 *       500:
 *         description: Internal server error
 */
router.post("/password-reset", resetPasswordHandler as RequestHandler);

export default router;
