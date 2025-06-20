import { db } from "../db";
import { wishlist } from "../db/schema/wishlist.schema";
import { properties } from "../db/schema/properties.schema";
import { propertyImages } from "../db/schema/property_images.schema";
import { eq, and, sql } from "drizzle-orm";
import { propertyViews } from "../db/schema/property_views.schema";

export const getWishlist = async (userId: string) => {
  const result = await db
    .select({
      property: properties,
      images: sql<string[]>`
        array_agg(property_images.image_url ORDER BY property_images.is_primary DESC)
        FILTER (WHERE property_images.image_url IS NOT NULL)
      `,
      views: sql<any[]>`
        array_agg(DISTINCT jsonb_build_object(
          'id', property_views.id,
          'propertyId', property_views.property_id
        ))
        FILTER (WHERE property_views.id IS NOT NULL)
      `,
    })
    .from(wishlist)
    .innerJoin(properties, eq(wishlist.propertyId, properties.id))
    .leftJoin(propertyImages, eq(properties.id, propertyImages.propertyId))
    .leftJoin(propertyViews, eq(properties.id, propertyViews.propertyId))
    .where(eq(wishlist.userId, userId))
    .groupBy(properties.id);

  return result.map(({ property, images, views }) => ({
    ...property,
    images,
    views,
  }));
};

export const addToWishlist = async (userId: string, propertyId: string) => {
  await db.insert(wishlist).values({ userId, propertyId });
};

export const removeFromWishlist = async (
  userId: string,
  propertyId: string,
) => {
  await db
    .delete(wishlist)
    .where(
      and(eq(wishlist.userId, userId), eq(wishlist.propertyId, propertyId)),
    );
};

export const isInWishlist = async (userId: string, propertyId: string) => {
  const result = await db
    .select()
    .from(wishlist)
    .where(
      and(eq(wishlist.userId, userId), eq(wishlist.propertyId, propertyId)),
    );
  return result.length > 0;
};
