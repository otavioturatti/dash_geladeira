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

  app.patch("/api/users/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const { name } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "Invalid name" });
    }

    const user = await storage.updateUser(id, name.trim());
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  });

  app.delete("/api/users/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteUser(id);
    res.status(204).send();
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

  app.patch("/api/products/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const { name, price, type, icon, borderColor } = req.body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (price !== undefined) updateData.price = price;
    if (type !== undefined) updateData.type = type;
    if (icon !== undefined) updateData.icon = icon;
    if (borderColor !== undefined) updateData.borderColor = borderColor;

    const product = await storage.updateProduct(id, updateData);
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

  // Admin authentication
  app.post("/api/admin/login", async (req, res) => {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD || "Recria123_Ai";

    if (password === adminPassword) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: "Invalid password" });
    }
  });

  // User PIN authentication
  app.post("/api/users/login", async (req, res) => {
    const { userId, pin } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: "Usuário não especificado" });
    }

    if (!pin || pin.length !== 4) {
      return res.status(400).json({ success: false, message: "PIN deve ter 4 dígitos" });
    }

    const user = await storage.authenticateUserByPin(userId, pin);

    if (user) {
      res.json({
        success: true,
        user,
        mustResetPin: user.mustResetPin === "true"
      });
    } else {
      res.status(401).json({ success: false, message: "PIN incorreto" });
    }
  });

  // Reset user PIN
  app.post("/api/users/:id/reset-pin", async (req, res) => {
    const id = parseInt(req.params.id);
    const { newPin } = req.body;

    if (!newPin || newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      return res.status(400).json({ message: "PIN deve ter exatamente 4 dígitos numéricos" });
    }

    if (newPin === "0000") {
      return res.status(400).json({ message: "PIN não pode ser 0000" });
    }

    // Verificar se o PIN já está em uso por outro usuário
    const pinInUse = await storage.isPinInUse(newPin, id);
    if (pinInUse) {
      return res.status(400).json({ message: "Este PIN já está em uso por outro usuário. Escolha outro PIN." });
    }

    const user = await storage.updateUserPin(id, newPin);
    await storage.setUserMustResetPin(id, false);

    res.json(user);
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
