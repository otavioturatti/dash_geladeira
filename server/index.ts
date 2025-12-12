import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { db } from "./db"; // Ajuste o caminho se necessário
import { users, products, transactions } from "@shared/schema";
import { sql } from "drizzle-orm";

const app = express( );
const httpServer = createServer(app );

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf ) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Criar tabelas se não existirem
  try {
    log("Ensuring database tables exist...");
    
    // Criar tabela users
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL
      )
    `);
    
    // Criar tabela products
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        type TEXT NOT NULL DEFAULT 'other',
        icon TEXT,
        border_color TEXT
      )
    `);

    // Adicionar coluna border_color se não existir
    await db.execute(sql`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS border_color TEXT
    `);
    
    // Criar tabela transactions
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id SERIAL NOT NULL REFERENCES users(id),
        product_id SERIAL NOT NULL REFERENCES products(id),
        product_name TEXT NOT NULL,
        price REAL NOT NULL,
        timestamp TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Criar tabela purchase_history (histórico permanente)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS purchase_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        user_name TEXT NOT NULL,
        product_name TEXT NOT NULL,
        price REAL NOT NULL,
        timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
        month TEXT NOT NULL
      )
    `);
    
    log("Database tables created successfully");
  } catch (error) {
    log(`Database setup error: ${error}`);
  }

  await registerRoutes(httpServer, app );

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app );
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    ( ) => {
      log(`serving on port ${port}`);
    },
  );
})();
