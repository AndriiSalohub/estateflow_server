import { db } from "../db";
import { properties } from "../db/schema/properties.schema";
import { subscriptionPlans } from "../db/schema/subscription_plans.schema";
import { subscriptions } from "../db/schema/subscriptions.schema";
import { users } from "../db/schema/users.schema";
import { and, eq, gte, inArray, ne } from "drizzle-orm";
import bcrypt from "bcrypt";
import { Role } from "../types/auth.types";
import { propertyImages } from "../db/schema/property_images.schema";

export const getUser = async (userId: string) => {
  const userResult = await db
    .select({
      id: users.id,
      email: users.email,
      username: users.username,
      role: users.role,
      avatarUrl: users.avatarUrl,
      bio: users.bio,
      isEmailVerified: users.isEmailVerified,
      listingLimit: users.listingLimit,
      paypalCredentials: users.paypalCredentials,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (userResult.length === 0) {
    throw new Error("User not found");
  }

  const user = userResult[0];

  return {
    userId: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    isEmailVerified: user.isEmailVerified,
    listingLimit: user.listingLimit,
    paypalCredentials: user.paypalCredentials,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

export const getUserById = async (userId: string) => {
  const userResult = await db
    .select({
      id: users.id,
      email: users.email,
      username: users.username,
      role: users.role,
      avatarUrl: users.avatarUrl,
      bio: users.bio,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      listingLimit: users.listingLimit,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (userResult.length === 0) {
    throw new Error("User not found");
  }

  const user = userResult[0];

  const propertiesResult = await db
    .select({
      id: properties.id,
      title: properties.title,
      description: properties.description,
      propertyType: properties.propertyType,
      transactionType: properties.transactionType,
      price: properties.price,
      currency: properties.currency,
      size: properties.size,
      rooms: properties.rooms,
      address: properties.address,
      createdAt: properties.createdAt,
      status: properties.status,
      updatedAt: properties.updatedAt,
    })
    .from(properties)
    .where(
      and(eq(properties.ownerId, user.id), eq(properties.isVerified, true)),
    );

  const propertyIds = propertiesResult.map((prop) => prop.id);
  const imagesResult =
    propertyIds.length > 0
      ? await db
          .select({
            propertyId: propertyImages.propertyId,
            id: propertyImages.id,
            imageUrl: propertyImages.imageUrl,
            isPrimary: propertyImages.isPrimary,
            createdAt: propertyImages.createdAt,
          })
          .from(propertyImages)
          .where(inArray(propertyImages.propertyId, propertyIds))
      : [];

  const imagesByPropertyId = imagesResult.reduce(
    (acc, image) => {
      if (!acc[image.propertyId]) {
        acc[image.propertyId] = [];
      }
      acc[image.propertyId].push({
        id: image.id,
        imageUrl: image.imageUrl,
        isPrimary: image.isPrimary,
        createdAt: image.createdAt,
      });
      return acc;
    },
    {} as Record<string, any[]>,
  );

  const propertiesWithImages = propertiesResult.map((property) => ({
    ...property,
    images: imagesByPropertyId[property.id] || [],
  }));

  const subscriptionResult = await db
    .select({
      status: subscriptions.status,
      startDate: subscriptions.startDate,
      endDate: subscriptions.endDate,
      planName: subscriptionPlans.name,
      planPrice: subscriptionPlans.price,
      planCurrency: subscriptionPlans.currency,
    })
    .from(subscriptions)
    .leftJoin(
      subscriptionPlans,
      eq(subscriptions.subscriptionPlanId, subscriptionPlans.id),
    )
    .where(
      and(
        eq(subscriptions.userId, user.id),
        gte(subscriptions.endDate, new Date()),
      ),
    );

  return {
    userId: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    listingLimit: user.listingLimit,
    properties: propertiesWithImages,
    subscription: subscriptionResult.length > 0 ? subscriptionResult[0] : {},
  };
};

export const getAllUsers = async (userId: string) => {
  const allUsers = await db.select().from(users).where(ne(users.id, userId));
  return allUsers;
};

export const updateUser = async (
  userId: string,
  data: {
    username?: string;
    avatarUrl?: string;
    bio?: string;
    paypalCredentials?: string;
  },
) => {
  const updateData: any = {};
  if (data.username !== undefined) updateData.username = data.username;
  if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;
  if (data.bio !== undefined) updateData.bio = data.bio;
  if (data.paypalCredentials !== undefined)
    updateData.paypalCredentials = data.paypalCredentials;
  if (
    data.username !== undefined ||
    data.avatarUrl !== undefined ||
    data.bio !== undefined ||
    data.paypalCredentials !== undefined
  )
    updateData.updatedAt = new Date();

  if (Object.keys(updateData).length === 0) {
    throw new Error("No valid fields to update");
  }

  await db.update(users).set(updateData).where(eq(users.id, userId));

  const userResult = await db
    .select({
      id: users.id,
      email: users.email,
      username: users.username,
      avatarUrl: users.avatarUrl,
      bio: users.bio,
      paypalCredentials: users.paypalCredentials,
      role: users.role,
      isEmailVerified: users.isEmailVerified,
      listingLimit: users.listingLimit,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (userResult.length === 0) {
    throw new Error("User not found");
  }

  const user = userResult[0];
  return {
    username: user.username,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    paypalCredentials: user.paypalCredentials,
    updatedAt: user.updatedAt,
  };
};

export const updateUserById = async (
  userId: string,
  updatedUserInfo: {
    username?: string;
    avatarUrl?: string;
    bio?: string;
    email?: string;
    role?: "renter_buyer" | "private_seller" | "agency" | "moderator" | "admin";
    listingLimit?: number;
  },
) => {
  const updateData: any = {};
  if (updatedUserInfo.username) updateData.username = updatedUserInfo.username;
  if (updatedUserInfo.avatarUrl)
    updateData.avatarUrl = updatedUserInfo.avatarUrl;
  if (updatedUserInfo.bio) updateData.bio = updatedUserInfo.bio;
  if (updatedUserInfo.role) updateData.role = updatedUserInfo.role;
  if (updatedUserInfo.listingLimit !== undefined)
    updateData.listingLimit = updatedUserInfo.listingLimit;

  if (updatedUserInfo.email) {
    const existingUser = await db
      .select({ email: users.email })
      .from(users)
      .where(and(eq(users.email, updatedUserInfo.email), ne(users.id, userId)));

    if (existingUser.length > 0) {
      throw new Error("User with this email already exists");
    }
    updateData.email = updatedUserInfo.email;
  }

  if (Object.keys(updateData).length === 0) {
    throw new Error("No valid fields to update");
  }

  updateData.updatedAt = new Date();

  await db.update(users).set(updateData).where(eq(users.id, userId));

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (userResult.length === 0) {
    throw new Error("User not found");
  }

  return userResult[0];
};

export const addNewUser = async (newUser: {
  avatarUrl: string;
  username: string;
  email: string;
  password: string;
  role: Role;
  bio: string;
}) => {
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, newUser.email));

  if (existingUser.length) {
    throw new Error("User with this email already exists");
  }

  const passwordHash = await bcrypt.hash(newUser.password, 10);

  const [insertedUser] = await db
    .insert(users)
    .values({
      username: newUser.username,
      email: newUser.email,
      passwordHash,
      role: newUser.role as Role,
      avatarUrl: newUser.avatarUrl,
      bio: newUser.bio,
      isEmailVerified: true,
    })
    .returning();

  return insertedUser;
};

export const deleteUser = async (userId: string) => {
  const [deletedUser] = await db
    .delete(users)
    .where(eq(users.id, userId))
    .returning();

  if (!deletedUser) {
    throw new Error("User not found");
  }

  return deletedUser;
};
