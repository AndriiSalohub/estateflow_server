import type { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import * as viewService from "../services/view.service";

type ExpressHandler = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => Promise<void>;

export const viewProperty: ExpressHandler = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { propertyId } = req.body;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized: User ID not found" });
      return;
    }
    if (!propertyId) {
      res.status(400).json({ message: "Bad Request: propertyId is required" });
      return;
    }

    await viewService.viewProperty(userId, propertyId);
    res.status(200).json({ message: "Property view recorded successfully" });
  } catch (error) {
    console.error("Error in viewProperty:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
