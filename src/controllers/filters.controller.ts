import type { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import * as filtersService from "../services/filters.service";

type ExpressHandler = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => Promise<void>;

export const getPriceRange: ExpressHandler = async (req, res) => {
  try {
    const priceRange = await filtersService.getPriceRange();

    if (
      !priceRange ||
      typeof priceRange.minPrice !== "number" ||
      typeof priceRange.maxPrice !== "number"
    ) {
      res.status(404).json({
        success: false,
        message: "No valid price range data found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      priceRange,
    });
  } catch (error) {
    console.error("Error fetching price range:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getAreaRange: ExpressHandler = async (req, res) => {
  try {
    const areaRange = await filtersService.getAreaRange();

    if (
      !areaRange ||
      typeof areaRange.minArea !== "number" ||
      typeof areaRange.maxArea !== "number"
    ) {
      res.status(404).json({
        success: false,
        message: "No valid area range data found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      areaRange,
    });
  } catch (error) {
    console.error("Error fetching area range:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getRooms: ExpressHandler = async (req, res) => {
  try {
    const roomsData = await filtersService.getRooms();

    if (!roomsData || roomsData.rooms.length === 0) {
      res.status(404).json({
        success: false,
        message: "No valid rooms data found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      rooms: roomsData.rooms,
    });
  } catch (error) {
    console.error("Error fetching rooms:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getTransactionTypes: ExpressHandler = async (req, res) => {
  try {
    const transactionTypesData = await filtersService.getTransactionTypes();

    if (
      !transactionTypesData ||
      !Array.isArray(transactionTypesData.transactionTypes) ||
      transactionTypesData.transactionTypes.length === 0
    ) {
      res.status(404).json({
        success: false,
        message: "No valid transaction types data found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      transactionTypes: transactionTypesData.transactionTypes,
    });
  } catch (error) {
    console.error("Error fetching transaction types:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getPropertyTypes: ExpressHandler = async (req, res) => {
  try {
    const propertyTypesData = await filtersService.getPropertyTypes();

    if (
      !propertyTypesData ||
      !Array.isArray(propertyTypesData.propertyTypes) ||
      propertyTypesData.propertyTypes.length === 0
    ) {
      res.status(404).json({
        success: false,
        message: "No valid property types data found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      propertyTypes: propertyTypesData.propertyTypes,
    });
  } catch (error) {
    console.error("Error fetching property types:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
