import {
  pgTable,
  uuid,
  timestamp,
  pgEnum,
  jsonb,
  foreignKey,
  text
} from "drizzle-orm/pg-core";
import { users } from "./users.schema";

export const documentTypeEnum = pgEnum("document_type", [
  "rental_agreement",
  "deposit_receipt",
]);

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  payment_id: text("payment_id"),
  document_type: documentTypeEnum("document_type").notNull(),
  document_data: jsonb("document_data").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});