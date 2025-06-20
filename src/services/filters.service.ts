import { eq } from "drizzle-orm";
import { db } from "../db";
import { properties } from "../db/schema/properties.schema";

export const getPriceRange = async () => {
  const prices = await db
    .select({
      price: properties.price,
    })
    .from(properties)
    .where(eq(properties.status, "active"));

  const priceArray = prices
    .map(({ price }) => +price)
    .filter((price) => !isNaN(price));
  if (priceArray.length === 0) {
    return null;
  }

  const minPrice = Math.min(...priceArray);
  const maxPrice = Math.max(...priceArray);

  return {
    minPrice,
    maxPrice,
  };
};

export const getAreaRange = async () => {
  const areas = await db
    .select({
      area: properties.size,
    })
    .from(properties)
    .where(eq(properties.status, "active"));

  const areaArray = areas
    .map(({ area }) => (area ? +area : 0))
    .filter((area) => !isNaN(area));
  if (areaArray.length === 0) {
    return null;
  }

  const minArea = Math.min(...areaArray);
  const maxArea = Math.max(...areaArray);

  return {
    minArea,
    maxArea,
  };
};

export const getRooms = async () => {
  const rooms = await db
    .selectDistinct({ rooms: properties.rooms })
    .from(properties)
    .where(eq(properties.status, "active"));

  const roomsArray = rooms
    .map(({ rooms }) => (rooms ? +rooms : 1))
    .filter((room) => !isNaN(room))
    .sort((a, b) => a - b);

  return roomsArray.length > 0 ? { rooms: roomsArray } : null;
};

export const getTransactionTypes = async () => {
  const transactionTypes = await db
    .selectDistinct({ transactionType: properties.transactionType })
    .from(properties)
    .where(eq(properties.status, "active"));

  const transactionTypesArray = transactionTypes
    .map(({ transactionType }) => transactionType)
    .filter((type) => type !== null && type !== undefined);

  return transactionTypesArray.length > 0
    ? { transactionTypes: transactionTypesArray }
    : null;
};

export const getPropertyTypes = async () => {
  const propertyTypes = await db
    .selectDistinct({ propertyType: properties.propertyType })
    .from(properties)
    .where(eq(properties.status, "active"));

  const propertyTypesArray = propertyTypes
    .map(({ propertyType }) => propertyType)
    .filter((type) => type !== null && type !== undefined);

  return propertyTypesArray.length > 0
    ? { propertyTypes: propertyTypesArray }
    : null;
};
