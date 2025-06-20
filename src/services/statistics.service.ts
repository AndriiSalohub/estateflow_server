import { db } from "../db";
import { sql } from "drizzle-orm";
import { and, between, eq } from "drizzle-orm";
import { properties } from "../db/schema/properties.schema";
import { propertyViews } from "../db/schema/property_views.schema";
import { users } from "../db/schema/users.schema";

export const UKRAINE_REGIONS = [
  "Вінницька",
  "Волинська",
  "Дніпропетровська",
  "Донецька",
  "Житомирська",
  "Закарпатська",
  "Запорізька",
  "Івано-Франківська",
  "Київська",
  "Кіровоградська",
  "Луганська",
  "Львівська",
  "Миколаївська",
  "Одеська",
  "Полтавська",
  "Рівненська",
  "Сумська",
  "Тернопільська",
  "Харківська",
  "Херсонська",
  "Хмельницька",
  "Черкаська",
  "Чернівецька",
  "Чернігівська",
];

export const getPropertyCountByRegion = async (
  startDate: Date,
  endDate: Date,
) => {
  const results: { region: string; total: number }[] = [];

  for (const region of UKRAINE_REGIONS) {
    const res = await db.execute(
      sql`
        SELECT COUNT(*)::int AS total
        FROM ${properties}
        WHERE created_at BETWEEN ${startDate} AND ${endDate}
        AND address ILIKE '%' || ${region} || '%'
      `,
    );

    const total = (res as any).rows?.[0]?.total ?? 0;

    results.push({ region, total });
  }

  return results;
};

export const getPriceStatsByRegion = async (startDate: Date, endDate: Date) => {
  const results: {
    region: string;
    min: number | null;
    max: number | null;
    avg: number | null;
  }[] = [];

  for (const region of UKRAINE_REGIONS) {
    const res = await db.execute(
      sql`
        SELECT 
          MIN(price)::float AS min,
          MAX(price)::float AS max,
          AVG(price)::float AS avg
        FROM ${properties}
        WHERE created_at BETWEEN ${startDate} AND ${endDate}
        AND address ILIKE '%' || ${region} || '%'
      `,
    );

    const row = (res as any).rows?.[0];

    results.push({
      region,
      min: row?.min ?? null,
      max: row?.max ?? null,
      avg: row?.avg ?? null,
    });
  }

  return results;
};

export const getTopRegions = async (
  startDate: Date,
  endDate: Date,
  limit = 5,
) => {
  const counts = [];

  for (const region of UKRAINE_REGIONS) {
    const res = await db.execute(
      sql`
        SELECT COUNT(*)::int AS total
        FROM ${properties}
        WHERE created_at BETWEEN ${startDate} AND ${endDate}
        AND address ILIKE '%' || ${region} || '%'
      `,
    );

    const total = (res as any).rows?.[0]?.total ?? 0;
    counts.push({ region, total });
  }

  counts.sort((a, b) => b.total - a.total);

  return counts.slice(0, limit);
};

export const getAveragePriceGrowth = async (
  previousStart: Date,
  previousEnd: Date,
  currentStart: Date,
  currentEnd: Date,
) => {
  const results: {
    region: string;
    previousAvg: number | null;
    currentAvg: number | null;
    growthPercent: number | null;
  }[] = [];

  for (const region of UKRAINE_REGIONS) {
    const prevRes = await db.execute(
      sql`
        SELECT AVG(price)::float AS avg_price
        FROM ${properties}
        WHERE created_at BETWEEN ${previousStart} AND ${previousEnd}
        AND address ILIKE '%' || ${region} || '%'
      `,
    );
    const previousAvg = (prevRes as any).rows?.[0]?.avg_price ?? null;

    const currRes = await db.execute(
      sql`
        SELECT AVG(price)::float AS avg_price
        FROM ${properties}
        WHERE created_at BETWEEN ${currentStart} AND ${currentEnd}
        AND address ILIKE '%' || ${region} || '%'
      `,
    );
    const currentAvg = (currRes as any).rows?.[0]?.avg_price ?? null;

    let growthPercent: number | null = null;
    if (previousAvg !== null && previousAvg !== 0 && currentAvg !== null) {
      growthPercent = ((currentAvg - previousAvg) / previousAvg) * 100;
    }

    results.push({ region, previousAvg, currentAvg, growthPercent });
  }

  return results;
};

export const getPropertyViewStatsByDate = async (
  propertyId: string,
  startDate: Date,
  endDate: Date,
) => {
  const adjustedEndDate = new Date(endDate);
  adjustedEndDate.setHours(23, 59, 59, 999);

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(propertyViews)
    .where(
      and(
        eq(propertyViews.propertyId, propertyId),
        between(propertyViews.viewedAt, startDate, adjustedEndDate),
      ),
    );

  return result[0]?.count ?? 0;
};

export const getTotalSales = async (startDate: Date, endDate: Date) => {
  const adjustedEndDate = new Date(endDate);
  adjustedEndDate.setHours(23, 59, 59, 999);

  const result = await db.execute(sql`
    SELECT 
      COUNT(*)::int AS total_sales,
      SUM(price)::numeric AS total_amount
    FROM ${properties}
    WHERE updated_at BETWEEN ${startDate} AND ${adjustedEndDate}
    AND status IN ('sold', 'rented')
  `);

  return {
    totalSales: (result as any).rows?.[0]?.total_sales ?? 0,
    totalAmount: (result as any).rows?.[0]?.total_amount ?? "0",
  };
};

export const getTopViewedProperties = async (
  startDate: Date,
  endDate: Date,
  limit = 10,
) => {
  const adjustedEndDate = new Date(endDate);
  adjustedEndDate.setHours(23, 59, 59, 999);

  const result = await db.execute(sql`
    SELECT 
      p.id,
      p.title,
      p.price,
      p.address,
      COALESCE(COUNT(pv.id), 0)::int AS view_count
    FROM ${properties} p
    LEFT JOIN ${propertyViews} pv 
      ON p.id = pv.property_id 
      AND pv.viewed_at BETWEEN ${startDate} AND ${adjustedEndDate}
    GROUP BY p.id, p.title, p.price, p.address
    ORDER BY view_count DESC
    LIMIT ${limit}
  `);

  return (result as any).rows ?? [];
};

export const getNewUsersStats = async (startDate: Date, endDate: Date) => {
  const adjustedEndDate = new Date(endDate);
  adjustedEndDate.setHours(23, 59, 59, 999);

  const result = await db.execute(sql`
    SELECT 
      COUNT(CASE WHEN role = 'renter_buyer' THEN 1 END)::int AS new_buyers,
      COUNT(CASE WHEN role = 'private_seller' THEN 1 END)::int AS new_sellers,
      COUNT(CASE WHEN role = 'agency' THEN 1 END)::int AS new_agencies
    FROM ${users}
    WHERE created_at BETWEEN ${startDate} AND ${adjustedEndDate}
  `);

  return (
    (result as any).rows?.[0] ?? {
      new_buyers: 0,
      new_sellers: 0,
      new_agencies: 0,
    }
  );
};
