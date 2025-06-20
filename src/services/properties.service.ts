import { db } from "../db";
import { pricingHistory } from "../db/schema/pricing_history.schema";
import { properties } from "../db/schema/properties.schema";
import { propertyImages } from "../db/schema/property_images.schema";
import { propertyViews } from "../db/schema/property_views.schema";
import { eq, inArray, and, sql } from "drizzle-orm";
import {
  Property,
  PropertyImage,
  PricingHistory,
  PropertyWithRelations,
  CreatePropertyInput,
  UpdatePropertyInput,
} from "../types/properties.types";
import { users } from "../db/schema/users.schema";
import { wishlist } from "../db/schema/wishlist.schema";
import { sendPriceChangeNotification } from "./email.service";
import { conversations } from "../db/schema/conversations.schema";
import { messages } from "../db/schema/messages.schema";
import { activeChatSessions, genAI } from "./ai.service";
import { systemPrompts } from "../db/schema/system_prompts.schema";
import { v4 as uuidv4 } from "uuid";

const isPropertyWished = async (
  propertyId: string,
  userId?: string,
): Promise<boolean> => {
  if (!userId) return false;

  const result = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(wishlist)
    .where(
      and(eq(wishlist.propertyId, propertyId), eq(wishlist.userId, userId)),
    )
    .limit(1);

  return result[0].count > 0;
};

export const getProperties = async (
  filterParam: string = "active",
  userId?: string,
): Promise<PropertyWithRelations[]> => {
  let propertiesList;

  switch (filterParam) {
    case "active":
      propertiesList = await db
        .select({
          property: properties,
          owner: {
            id: users.id,
            email: users.email,
            username: users.username,
            role: users.role,
            isEmailVerified: users.isEmailVerified,
            paypalCredentials: users.paypalCredentials,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt,
          },
        })
        .from(properties)
        .leftJoin(users, eq(properties.ownerId, users.id))
        .where(
          and(eq(properties.status, "active"), eq(properties.isVerified, true)),
        );
      break;
    case "sold_rented":
      propertiesList = await db
        .select({
          property: properties,
          owner: {
            id: users.id,
            email: users.email,
            username: users.username,
            role: users.role,
          },
        })
        .from(properties)
        .leftJoin(users, eq(properties.ownerId, users.id))
        .where(
          and(
            inArray(properties.status, ["sold", "rented"]),
            eq(properties.isVerified, true),
          ),
        );
      break;
    case "inactive":
      propertiesList = await db
        .select({
          property: properties,
          owner: {
            id: users.id,
            email: users.email,
            username: users.username,
            role: users.role,
          },
        })
        .from(properties)
        .leftJoin(users, eq(properties.ownerId, users.id))
        .where(
          and(
            eq(properties.status, "inactive"),
            eq(properties.isVerified, true),
          ),
        );
      break;
    default:
      propertiesList = await db
        .select({
          property: properties,
          owner: {
            id: users.id,
            email: users.email,
            username: users.username,
            role: users.role,
          },
        })
        .from(properties)
        .leftJoin(users, eq(properties.ownerId, users.id));
      break;
  }
  if (propertiesList.length === 0) {
    return [];
  }

  const propertyIds = propertiesList.map((p) => p.property.id);

  const [images, views, pricing, wishedStatuses] = await Promise.all([
    db
      .select()
      .from(propertyImages)
      .where(inArray(propertyImages.propertyId, propertyIds)),
    db
      .select()
      .from(propertyViews)
      .where(inArray(propertyViews.propertyId, propertyIds)),
    db
      .select()
      .from(pricingHistory)
      .where(inArray(pricingHistory.propertyId, propertyIds)),
    Promise.all(
      propertyIds.map((propertyId) => isPropertyWished(propertyId, userId)),
    ),
  ]);

  return propertiesList.map(({ property, owner }, index) => ({
    ...property,
    images: images.filter((img) => img.propertyId === property.id),
    views: views.filter((view) => view.propertyId === property.id),
    pricingHistory: pricing.filter((p) => p.propertyId === property.id),
    owner: {
      id: owner?.id ?? "",
      email: owner?.email ?? "",
      username: owner?.username ?? "",
      role: owner?.role ?? "",
    },
    isWished: wishedStatuses[index],
  }));
};

export const getProperty = async (
  propertyId: string,
  userId?: string,
): Promise<PropertyWithRelations> => {
  const property = await db
    .select({
      property: properties,
      image: propertyImages,
      view: propertyViews,
      pricing: pricingHistory,
      owner: {
        id: users.id,
        email: users.email,
        username: users.username,
        role: users.role,
      },
      isWished: userId
        ? sql<boolean>`EXISTS (
            SELECT 1
            FROM ${wishlist}
            WHERE ${wishlist.propertyId} = ${properties.id}
            AND ${wishlist.userId} = ${userId}
          )`.as("isWished")
        : sql<boolean>`FALSE`.as("isWished"),
    })
    .from(properties)
    .where(eq(properties.id, propertyId))
    .leftJoin(propertyImages, eq(properties.id, propertyImages.propertyId))
    .leftJoin(propertyViews, eq(properties.id, propertyViews.propertyId))
    .leftJoin(pricingHistory, eq(properties.id, pricingHistory.propertyId))
    .leftJoin(users, eq(properties.ownerId, users.id));

  if (property.length === 0) {
    throw new Error(`Property with ID ${propertyId} not found`);
  }

  const isWished = await isPropertyWished(propertyId, userId);

  const propertyWithRelations = property.reduce(
    (acc: PropertyWithRelations, row) => {
      const { property, image, view, pricing, owner } = row;

      if (!acc.id) {
        acc = {
          ...property,
          images: [],
          views: [],
          pricingHistory: [],
          owner: {
            id: owner?.id ?? "",
            email: owner?.email ?? "",
            username: owner?.username ?? "",
            role: owner?.role ?? "",
          },
          isWished,
        };
      }

      if (image && !acc.images.some((img) => img.id === image.id)) {
        acc.images.push(image);
      }
      if (view && !acc.views.some((v) => v.id === view.id)) {
        acc.views.push(view);
      }
      if (pricing && !acc.pricingHistory.some((p) => p.id === pricing.id)) {
        acc.pricingHistory.push(pricing);
      }

      return acc;
    },
    {} as PropertyWithRelations,
  );

  return propertyWithRelations;
};

export const addNewProperty = async (input: CreatePropertyInput) => {
  const user = await db
    .select({
      role: users.role,
      listingLimit: users.listingLimit,
    })
    .from(users)
    .where(eq(users.id, input.ownerId))
    .limit(1);

  if (!user[0]) {
    throw new Error("User not found");
  }

  const { role, listingLimit } = user[0];

  if (role === "private_seller" && listingLimit !== null && listingLimit <= 0) {
    throw new Error("Listings limit reached");
  }

  const newProperty = await db
    .insert(properties)
    .values({
      ownerId: input.ownerId,
      title: input.title,
      description: input.description,
      facilities: input.facilities,
      propertyType: input.propertyType,
      transactionType: input.transactionType,
      price: input.price,
      currency: input.currency || "USD",
      size: input.size,
      rooms: input.rooms,
      address: input.address,
      status: input.status || "active",
      documentUrl: input.documentUrl,
      verificationComments: input.verificationComments,
    })
    .returning();

  const property = newProperty[0];
  const owner = await db
    .select({ role: users.role, listingLimit: users.listingLimit })
    .from(users)
    .where(eq(users.id, input.ownerId));
  const ownerData = owner[0];

  if (role === "private_seller" && (listingLimit || 0) !== 0) {
    await db
      .update(users)
      .set({ listingLimit: (ownerData?.listingLimit || 1) - 1 })
      .where(eq(users.id, input.ownerId));
  }

  let images: PropertyImage[] = [];
  if (input.images && input.images.length > 0) {
    images = await db
      .insert(propertyImages)
      .values(
        input.images.map((img) => ({
          propertyId: property.id,
          imageUrl: img.imageUrl,
          isPrimary: img.isPrimary,
        })),
      )
      .returning();
  }

  const pricingHistoryRecord = await db
    .insert(pricingHistory)
    .values({
      propertyId: property.id,
      price: input.price,
      currency: input.currency || "USD",
      effectiveDate: new Date(),
    })
    .returning();

  return {
    ...property,
    images,
    views: [],
    pricingHistory: pricingHistoryRecord,
  };
};

export const deleteProperty = async (propertyId: string): Promise<void> => {
  try {
    const existingProperty = await db
      .select()
      .from(properties)
      .where(eq(properties.id, propertyId))
      .limit(1);

    if (!existingProperty.length) {
      throw new Error(`Property with ID ${propertyId} not found`);
    }

    await db.delete(properties).where(eq(properties.id, propertyId));
    console.log(`Property with ID ${propertyId} deleted successfully`);
  } catch (error: any) {
    throw new Error(`Failed to delete property: ${error.message}`);
  }
};

export const updateProperty = async (
  propertyId: string,
  input: UpdatePropertyInput,
): Promise<PropertyWithRelations> => {
  const existingProperty = await db
    .select()
    .from(properties)
    .where(eq(properties.id, propertyId))
    .limit(1);

  if (!existingProperty.length) {
    throw new Error(`Property with ID ${propertyId} not found`);
  }

  const updateData: Partial<Property> = {};
  if (input.title !== undefined) {
    updateData.title = input.title;
  }
  if (input.description !== undefined) {
    updateData.description = input.description;
  }
  if (input.facilities !== undefined) {
    updateData.facilities = input.facilities;
  }
  if (input.propertyType !== undefined) {
    updateData.propertyType = input.propertyType;
  }
  if (input.transactionType !== undefined) {
    updateData.transactionType = input.transactionType;
  }
  if (input.price !== undefined) {
    updateData.price = input.price;

    if (existingProperty[0].price !== input.price) {
      const wishlistItems = await db
        .select({ userId: wishlist.userId })
        .from(wishlist)
        .where(eq(wishlist.propertyId, propertyId));

      const userIds = wishlistItems.map((item) => item.userId);
      const allUsers = await db
        .select({ id: users.id, email: users.email })
        .from(users)
        .where(inArray(users.id, userIds));

      if (allUsers.length > 0) {
        const propertyDetails = {
          name: existingProperty[0].title,
          address: existingProperty[0].address || "N/A",
          oldPrice: existingProperty[0].price,
          newPrice: input.price,
        };

        await Promise.all(
          allUsers.map((user) =>
            user.email
              ? sendPriceChangeNotification(user.email, propertyDetails)
              : Promise.resolve(),
          ),
        );
      }
    }
  }
  if (input.currency !== undefined) {
    updateData.currency = input.currency;
  }
  if (input.size !== undefined) {
    updateData.size = input.size;
  }
  if (input.rooms !== undefined) {
    updateData.rooms = input.rooms;
  }
  if (input.address !== undefined) {
    updateData.address = input.address;
  }
  if (input.status !== undefined) {
    updateData.status = input.status;
  }
  if (input.documentUrl !== undefined) {
    updateData.documentUrl = input.documentUrl;
  }
  if (input.verificationComments !== undefined) {
    updateData.verificationComments = input.verificationComments;
  }
  if (input.isVerified !== undefined) {
    updateData.isVerified = input.isVerified;
  }

  updateData.updatedAt = new Date();

  const updatedProperty = await db
    .update(properties)
    .set(updateData)
    .where(eq(properties.id, propertyId))
    .returning();

  let images: PropertyImage[] = [];
  if (input.images !== undefined) {
    const existingImages = await db
      .select()
      .from(propertyImages)
      .where(eq(propertyImages.propertyId, propertyId));

    const newImages = input.images.filter(
      (img) =>
        !existingImages.some(
          (existingImg) =>
            existingImg.imageUrl === img.imageUrl &&
            existingImg.isPrimary === img.isPrimary,
        ),
    );

    if (newImages.length > 0) {
      await db
        .delete(propertyImages)
        .where(eq(propertyImages.propertyId, propertyId));

      images = await db
        .insert(propertyImages)
        .values(
          newImages.map((img) => ({
            propertyId,
            imageUrl: img.imageUrl,
            isPrimary: img.isPrimary,
          })),
        )
        .returning();
    } else {
      images = existingImages;
    }

    await db
      .delete(propertyImages)
      .where(eq(propertyImages.propertyId, propertyId));
    if (input.images.length > 0) {
      images = await db
        .insert(propertyImages)
        .values(
          input.images.map((img) => ({
            propertyId,
            imageUrl: img.imageUrl,
            isPrimary: img.isPrimary,
          })),
        )
        .returning();
    }
  }

  let pricingHistoryRecord: PricingHistory[] = [];
  if (input.price !== undefined || input.currency !== undefined) {
    const newPrice = input.price || existingProperty[0].price;
    const newCurrency = input.currency || existingProperty[0].currency || "USD";
    pricingHistoryRecord = await db
      .insert(pricingHistory)
      .values({
        propertyId,
        price: newPrice,
        currency: newCurrency,
        effectiveDate: new Date(),
      })
      .returning();
  }

  const [fetchedImages, views, pricing, owner] = await Promise.all([
    input.images !== undefined
      ? Promise.resolve(images)
      : db
          .select()
          .from(propertyImages)
          .where(eq(propertyImages.propertyId, propertyId)),
    db
      .select()
      .from(propertyViews)
      .where(eq(propertyViews.propertyId, propertyId)),
    db
      .select()
      .from(pricingHistory)
      .where(eq(pricingHistory.propertyId, propertyId)),
    db
      .select()
      .from(users)
      .where(eq(users.id, existingProperty[0].ownerId))
      .then((res) => res[0] || null),
  ]);

  return {
    ...updatedProperty[0],
    images: fetchedImages,
    views,
    pricingHistory:
      pricingHistoryRecord.length > 0
        ? pricing
        : await db
            .select()
            .from(pricingHistory)
            .where(eq(pricingHistory.propertyId, propertyId)),
    owner,
    isWished: false,
  };
};

export const verifyProperty = async (id: string) => {
  const result = await db
    .update(properties)
    .set({ isVerified: true })
    .where(eq(properties.id, id))
    .returning();

  const property = result[0];

  const [pricingHistoryRecords, images] = await Promise.all([
    db.select().from(pricingHistory).where(eq(pricingHistory.propertyId, id)),
    db.select().from(propertyImages).where(eq(propertyImages.propertyId, id)),
  ]);

  const newPropertySummary = `
      - ID: ${property.id}
      - Title: ${property.title || "Unknown"}
      - Type: ${property.propertyType || "Unknown"}
      - Description: ${property.description || "Unknown"}
      - Transaction: ${property.transactionType || "Unknown"}
      - Price: ${property.price ? `${property.price} ${property.currency}` : "Unknown"}
      - Size: ${property.size ? `${property.size} sqm` : "Unknown"}
      - Rooms: ${property.rooms || "Unknown"}
      - Address: ${property.address || "Unknown"}
      - Status: ${property.status || "Unknown"}
      - Is Verified: ${property.isVerified ? "Yes" : "No"}
      - Images: ${images.length || 0} images
      - Facilities: ${property.facilities || "Unknown"}
      - Pricing History: ${
        pricingHistoryRecords.length
          ? pricingHistoryRecords
              .map((ph) => `${ph.price} ${ph.currency} on ${ph.effectiveDate}`)
              .join(", ")
          : "None"
      }
  `;

  const activeConversations = await db
    .select({
      id: conversations.id,
      userId: conversations.userId,
      systemPromptId: conversations.systemPromptId,
    })
    .from(conversations)
    .where(eq(conversations.isActive, true));

  for (const conversation of activeConversations) {
    if (!conversation.systemPromptId) {
      console.warn(
        `Conversation ${conversation.id} has no systemPromptId, skipping.`,
      );
      continue;
    }

    const [systemMessage] = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.conversationId, conversation.id),
          eq(messages.sender, "system"),
          eq(messages.isVisible, false),
        ),
      )
      .limit(1);

    if (systemMessage) {
      const updatedContent = `${
        systemMessage.content
      }\n\n### New Property Added:\n${newPropertySummary}`;

      // Update the system message in the database
      await db
        .update(messages)
        .set({
          content: updatedContent,
        })
        .where(eq(messages.id, systemMessage.id));

      const chat = activeChatSessions.get(conversation.id);
      if (chat) {
        const messageHistory = await db
          .select({
            sender: messages.sender,
            content: messages.content,
          })
          .from(messages)
          .where(eq(messages.conversationId, conversation.id))
          .orderBy(messages.createdAt);

        const history = messageHistory.map((msg) => ({
          role: msg.sender === "ai" ? "model" : "user",
          parts: [{ text: msg.content }],
        }));

        const model = genAI.getGenerativeModel({
          model: "gemini-2.0-flash",
        });
        const updatedChat = model.startChat({
          history,
          generationConfig: {
            maxOutputTokens: 8192,
          },
        });

        activeChatSessions.set(conversation.id, updatedChat);
      }
    } else {
      const [defaultPrompt] = await db
        .select()
        .from(systemPrompts)
        .where(eq(systemPrompts.id, conversation.systemPromptId))
        .limit(1);

      if (defaultPrompt) {
        const newSystemMessageContent = `
          ${defaultPrompt.content}
          ### Available Properties:
          ${newPropertySummary}
        `;

        await db.insert(messages).values({
          id: uuidv4(),
          conversationId: conversation.id,
          sender: "system",
          content: newSystemMessageContent,
          createdAt: new Date(),
          isVisible: false,
        });

        const chat = activeChatSessions.get(conversation.id);
        if (chat) {
          const messageHistory = await db
            .select({
              sender: messages.sender,
              content: messages.content,
            })
            .from(messages)
            .where(eq(messages.conversationId, conversation.id))
            .orderBy(messages.createdAt);

          const history = messageHistory.map((msg) => ({
            role: msg.sender === "ai" ? "model" : "user",
            parts: [{ text: msg.content }],
          }));

          const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
          });
          const updatedChat = model.startChat({
            history,
            generationConfig: {
              maxOutputTokens: 8192,
            },
          });

          activeChatSessions.set(conversation.id, updatedChat);
        }
      } else {
        console.warn(
          `No system prompt found for conversation ${conversation.id}`,
        );
      }
    }
  }

  return result[0];
};
