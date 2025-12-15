import { db } from "./db";
import { users, products, transactions, purchaseHistory } from "@shared/schema";
import type {
  User, InsertUser,
  Product, InsertProduct,
  Transaction, InsertTransaction,
  PurchaseHistory, InsertPurchaseHistory
} from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, name: string): Promise<User | undefined>;
  deleteUser(id: number): Promise<void>;
  authenticateUserByPin(userId: number, pin: string): Promise<User | null>;
  updateUserPin(id: number, pin: string): Promise<User | undefined>;
  setUserMustResetPin(id: number, mustReset: boolean): Promise<User | undefined>;
  isPinInUse(pin: string, excludeUserId?: number): Promise<boolean>;

  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, data: Partial<InsertProduct>): Promise<Product | undefined>;
  updateProductPrice(id: number, price: number): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<void>;

  // Transactions
  getTransactions(): Promise<Transaction[]>;
  getUserTransactions(userId: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  deleteUserTransactions(userId: number): Promise<void>;
  deleteAllTransactions(): Promise<void>;

  // Purchase History
  getPurchaseHistory(): Promise<PurchaseHistory[]>;
  getUserPurchaseHistory(userId: number): Promise<PurchaseHistory[]>;
  createPurchaseHistory(history: InsertPurchaseHistory): Promise<PurchaseHistory>;
  getAvailableMonths(): Promise<string[]>;
  getPurchaseHistoryByMonth(month: string): Promise<PurchaseHistory[]>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(id: number, name: string): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ name })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async authenticateUserByPin(userId: number, pin: string): Promise<User | null> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    const user = result[0];
    if (user && user.pin === pin) {
      return user;
    }
    return null;
  }

  async updateUserPin(id: number, pin: string): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ pin })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async setUserMustResetPin(id: number, mustReset: boolean): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ mustResetPin: mustReset ? "true" : "false" })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async isPinInUse(pin: string, excludeUserId?: number): Promise<boolean> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.pin, pin));

    // Se encontrou usuários com esse PIN
    if (result.length === 0) return false;

    // Se deve excluir um usuário específico (caso de atualização)
    if (excludeUserId !== undefined) {
      return result.some((user: User) => user.id !== excludeUserId);
    }

    return true;
  }

  // Products
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id));
    return result[0];
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const result = await db.insert(products).values(insertProduct).returning();
    return result[0];
  }

  async updateProduct(id: number, data: Partial<InsertProduct>): Promise<Product | undefined> {
    const result = await db
      .update(products)
      .set(data)
      .where(eq(products.id, id))
      .returning();
    return result[0];
  }

  async updateProductPrice(id: number, price: number): Promise<Product | undefined> {
    const result = await db
      .update(products)
      .set({ price })
      .where(eq(products.id, id))
      .returning();
    return result[0];
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  // Transactions
  async getTransactions(): Promise<Transaction[]> {
    return await db.select().from(transactions);
  }

  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return await db.select().from(transactions).where(eq(transactions.userId, userId));
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const result = await db.insert(transactions).values(insertTransaction).returning();
    const transaction = result[0];

    // Salvar também no histórico permanente
    const user = await this.getUser(insertTransaction.userId);
    const currentMonth = new Date().toISOString().slice(0, 7); // "2025-01"

    await this.createPurchaseHistory({
      userId: insertTransaction.userId,
      userName: user?.name || "Desconhecido",
      productName: insertTransaction.productName,
      price: insertTransaction.price,
      month: currentMonth
    });

    return transaction;
  }

  async deleteUserTransactions(userId: number): Promise<void> {
    await db.delete(transactions).where(eq(transactions.userId, userId));
  }

  async deleteAllTransactions(): Promise<void> {
    await db.delete(transactions);
  }

  // Purchase History
  async getPurchaseHistory(): Promise<PurchaseHistory[]> {
    return await db.select().from(purchaseHistory).orderBy(desc(purchaseHistory.timestamp));
  }

  async getUserPurchaseHistory(userId: number): Promise<PurchaseHistory[]> {
    return await db
      .select()
      .from(purchaseHistory)
      .where(eq(purchaseHistory.userId, userId))
      .orderBy(desc(purchaseHistory.timestamp));
  }

  async createPurchaseHistory(insertHistory: InsertPurchaseHistory): Promise<PurchaseHistory> {
    const result = await db.insert(purchaseHistory).values(insertHistory).returning();
    return result[0];
  }

  async getAvailableMonths(): Promise<string[]> {
    const result = await db
      .selectDistinct({ month: purchaseHistory.month })
      .from(purchaseHistory)
      .orderBy(desc(purchaseHistory.month));
    return result.map(r => r.month);
  }

  async getPurchaseHistoryByMonth(month: string): Promise<PurchaseHistory[]> {
    return await db
      .select()
      .from(purchaseHistory)
      .where(eq(purchaseHistory.month, month))
      .orderBy(desc(purchaseHistory.timestamp));
  }
}

export const storage = new DatabaseStorage();
