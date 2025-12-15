import { pgTable, text, serial, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  pin: text("pin").notNull().default("0000"),
  mustResetPin: text("must_reset_pin").notNull().default("true"),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  price: real("price").notNull(),
  type: text("type").notNull().default("other"),
  icon: text("icon"),
  borderColor: text("border_color"),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").notNull().references(() => users.id),
  productId: serial("product_id").notNull().references(() => products.id),
  productName: text("product_name").notNull(),
  price: real("price").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Histórico permanente de todas as compras (não afeta saldo devedor)
export const purchaseHistory = pgTable("purchase_history", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").notNull(),
  userName: text("user_name").notNull(),
  productName: text("product_name").notNull(),
  price: real("price").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  month: text("month").notNull(), // formato: "2025-01"
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  timestamp: true
});
export const insertPurchaseHistorySchema = createInsertSchema(purchaseHistory).omit({
  id: true,
  timestamp: true
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

export type InsertPurchaseHistory = z.infer<typeof insertPurchaseHistorySchema>;
export type PurchaseHistory = typeof purchaseHistory.$inferSelect;
