/**
 * Express.js backend server for Study Hour Calendar
 */

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import recordsRouter from "./routes/records";
import plansRouter from "./routes/plans";

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || "5000", 10);
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/study-calendar";

// Log environment variables (without sensitive data)
console.log("Environment check:");
console.log("PORT:", PORT);
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("MONGODB_URI exists:", !!process.env.MONGODB_URI);
console.log("MONGODB_URI length:", process.env.MONGODB_URI?.length || 0);
console.log("MONGODB_URI starts with mongodb:", MONGODB_URI?.startsWith("mongodb") || false);

// CORS configuration
const corsOptions = {
  origin: [
    "http://localhost:3000", // Development
    process.env.FRONTEND_URL, // Production (will be set after Vercel deployment)
  ].filter((url): url is string => Boolean(url)) as string[], // Remove undefined values and ensure string[] type
  credentials: true,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", message: "Study Hour Calendar API is running" });
});

// API Routes
app.use("/api/records", recordsRouter);
app.use("/api/plans", plansRouter);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" });
});

// Connect to MongoDB and start server
async function startServer() {
  try {
    // Check if MONGODB_URI is properly configured
    if (!MONGODB_URI || 
        MONGODB_URI.trim() === "" || 
        MONGODB_URI.includes("localhost") ||
        !MONGODB_URI.startsWith("mongodb")) {
      console.error("❌ MONGODB_URI is not properly configured");
      console.error("Current value:", MONGODB_URI ? `"${MONGODB_URI.substring(0, 20)}..."` : "undefined");
      console.error("Please set MONGODB_URI environment variable in Railway");
      console.error("Expected format: mongodb+srv://username:password@cluster.mongodb.net/database");
      process.exit(1);
    }

    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 API endpoints available at http://0.0.0.0:${PORT}/api`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    process.exit(1);
  }
}

// Handle MongoDB connection events
mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected");
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("MongoDB connection closed");
  process.exit(0);
});

startServer();

export default app;

