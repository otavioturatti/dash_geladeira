import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertProductSchema, insertTransactionSchema, insertPurchaseHistorySchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Users
  app.get("/api/users", async (_req, res) => {
    const users = await storage.getUsers();
    res.json(users);
  });

  app.get("/api/users/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const user = await storage.getUser(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  // Products
  app.get("/api/products", async (_req, res) => {
    const products = await storage.getProducts();
    res.json(products);
  });

  app.get("/api/products/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const product = await storage.getProduct(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  });

  app.post("/api/products", async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({ message: "Invalid product data" });
    }
  });

  app.patch("/api/products/:id/price", async (req, res) => {
    const id = parseInt(req.params.id);
    const { price } = req.body;
    
    if (typeof price !== "number") {
      return res.status(400).json({ message: "Invalid price" });
    }

    const product = await storage.updateProductPrice(id, price);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  });

  app.delete("/api/products/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteProduct(id);
    res.status(204).send();
  });

  // Transactions
  app.get("/api/transactions", async (_req, res) => {
    const transactions = await storage.getTransactions();
    res.json(transactions);
  });

  app.get("/api/transactions/user/:userId", async (req, res) => {
    const userId = parseInt(req.params.userId);
    const transactions = await storage.getUserTransactions(userId);
    res.json(transactions);
  });

  app.post("/api/transactions", async (req, res) => {
    try {
      const transactionData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(transactionData);
      res.status(201).json(transaction);
    } catch (error) {
      res.status(400).json({ message: "Invalid transaction data" });
    }
  });

  app.delete("/api/transactions/user/:userId", async (req, res) => {
    const userId = parseInt(req.params.userId);
    await storage.deleteUserTransactions(userId);
    res.status(204).send();
  });

  app.delete("/api/transactions", async (_req, res) => {
    await storage.deleteAllTransactions();
    res.status(204).send();
  });

  // Purchase History (histórico permanente)
  app.get("/api/history", async (_req, res) => {
    const history = await storage.getPurchaseHistory();
    res.json(history);
  });

  app.get("/api/history/user/:userId", async (req, res) => {
    const userId = parseInt(req.params.userId);
    const history = await storage.getUserPurchaseHistory(userId);
    res.json(history);
  });

  app.get("/api/history/months", async (_req, res) => {
    const months = await storage.getAvailableMonths();
    res.json(months);
  });

  app.get("/api/history/month/:month", async (req, res) => {
    const month = req.params.month;
    const history = await storage.getPurchaseHistoryByMonth(month);
    res.json(history);
  });

  return httpServer;
}
