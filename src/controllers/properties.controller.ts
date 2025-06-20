import type { Request, Response, NextFunction } from "express";
import * as propertiesService from "../services/properties.service";
import { AuthRequest } from "../middleware/auth.middleware";

type ExpressHandler = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => Promise<void>;

export const getProperties: ExpressHandler = async (req, res) => {
  try {
    const filter = req.query.filter as string | undefined;
    const validFilters = ["active", "sold_rented", "inactive", ""];

    if (filter && !validFilters.includes(filter)) {
      res.status(400).json({
        error:
          "Invalid filter parameter. Use 'active', 'sold_rented', 'inactive', or omit for all properties.",
      });
      return;
    }

    const properties = await propertiesService.getProperties(
      filter ?? "",
      req.user?.userId,
    );
    res.status(200).json(properties);
  } catch (error) {
    console.error("Error fetching properties:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    res.status(500).json({ error: message });
  }
};

export const getProperty: ExpressHandler = async (req, res) => {
  try {
    const { propertyId } = req.params;

    if (!propertyId) {
      res.status(400).json({ error: "Property ID is required" });
      return;
    }

    const property = await propertiesService.getProperty(
      propertyId,
      req.user?.userId,
    );
    res.status(200).json(property);
  } catch (error: any) {
    console.error(`Error fetching property ${req.params.propertyId}:`, error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    res
      .status(error.message.includes("not found") ? 404 : 500)
      .json({ error: message });
  }
};

export const addNewProperty: ExpressHandler = async (req, res) => {
  try {
    const userId = req.user!.userId;
    const propertyData = req.body;
    const newProperty = await propertiesService.addNewProperty({
      ownerId: userId,
      ...propertyData,
    });
    res.status(201).json(newProperty);
  } catch (error: any) {
    console.error("Error adding property:", error);
    if (error.message === "Listings limit reached") {
      res.status(403).json({ message: "Listings limit reached" });
    } else {
      res
        .status(500)
        .json({ message: error.message || "Internal server error" });
    }
  }
};

export const deleteProperty: ExpressHandler = async (req, res) => {
  try {
    const { propertyId } = req.params;

    if (!propertyId) {
      res.status(400).json({ error: "Property ID is required" });
      return;
    }

    await propertiesService.deleteProperty(propertyId);
    res.status(200).json({ message: "Property deleted successfully" });
  } catch (error: any) {
    console.error(`Error deleting property ${req.params.propertyId}:`, error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    res
      .status(
        error.message.includes("not found")
          ? 404
          : error.message.includes("not authorized")
            ? 403
            : 500,
      )
      .json({ error: message });
  }
};

export const updateProperty: ExpressHandler = async (req, res) => {
  try {
    const { propertyId } = req.params;

    if (!propertyId) {
      res.status(400).json({ error: "Property ID is required" });
      return;
    }

    const updatedPropertyData = req.body;

    const updatedProperty = await propertiesService.updateProperty(
      propertyId,
      updatedPropertyData,
    );

    res.status(200).json({
      message: "Property updated successfully",
      data: updatedProperty,
    });
  } catch (error: any) {
    if (error.message.includes("not found")) {
      res.status(404).json({ error: error.message });
      return;
    }

    console.error("Error updating property:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const verifyPropertyHandler = async (req: Request, res: Response) => {
  const { id } = req.params;

  const updated = await propertiesService.verifyProperty(id);
  if (!updated) {
    return res.status(404).json({ message: "Property not found" });
  }

  return res.status(200).json(updated);
};
