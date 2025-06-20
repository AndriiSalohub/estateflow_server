import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { propertyViews } from "../db/schema/property_views.schema";

export const viewProperty = async (userId: string, propertyId: string) => {
  const propertyView = await db
    .select()
    .from(propertyViews)
    .where(
      and(
        eq(propertyViews.userId, userId),
        eq(propertyViews.propertyId, propertyId),
      ),
    );

  if (propertyView.length !== 0) {
    await db
      .update(propertyViews)
      .set({
        viewedAt: new Date(),
      })
      .where(
        and(
          eq(propertyViews.userId, userId),
          eq(propertyViews.propertyId, propertyId),
        ),
      );
  } else {
    await db.insert(propertyViews).values({
      userId,
      propertyId,
      viewedAt: new Date(),
    });
  }

  return { success: true };
};
