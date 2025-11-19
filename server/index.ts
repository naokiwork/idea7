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
// Use local MongoDB if MONGODB_URI is not set or if it's in development mode
const MONGODB_URI = process.env.MONGODB_URI || 
  (process.env.NODE_ENV === "development" 
    ? "mongodb://localhost:27017/study-calendar" 
    : "mongodb://localhost:27017/study-calendar");

// Log environment variables (without sensitive data)
console.log("Environment check:");
console.log("PORT:", PORT);
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("MONGODB_URI exists:", !!process.env.MONGODB_URI);
console.log("MONGODB_URI length:", process.env.MONGODB_URI?.length || 0);
console.log("MONGODB_URI starts with mongodb:", MONGODB_URI?.startsWith("mongodb") || false);

// CORS configuration - Allow all origins in development
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log(`Origin: ${req.headers.origin || 'none'}`);
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
    // Start server first, then connect to MongoDB
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 API endpoints available at http://0.0.0.0:${PORT}/api`);
    });

    // Connect to MongoDB (optional - server will work without it)
    if (MONGODB_URI && MONGODB_URI.trim() !== "") {
      console.log("🔄 Connecting to MongoDB...");
      console.log("MongoDB URI:", MONGODB_URI.includes("localhost") ? "Local MongoDB" : "MongoDB Atlas");
      try {
        await mongoose.connect(MONGODB_URI, {
          serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
        });
        console.log("✅ Connected to MongoDB");
      } catch (mongoError) {
        console.warn("⚠️  Failed to connect to MongoDB:", mongoError instanceof Error ? mongoError.message : mongoError);
        console.warn("Server is running but MongoDB features will not work");
        if (MONGODB_URI.includes("localhost")) {
          console.warn("💡 Tip: Make sure local MongoDB is running: brew services start mongodb-community");
        } else {
          console.warn("💡 Tip: Check your network connection and MongoDB Atlas settings");
        }
      }
    } else {
      console.warn("⚠️  MONGODB_URI is not set");
      console.warn("Server will start but MongoDB features will not work");
      console.warn("💡 To use local MongoDB, install it: brew install mongodb-community");
      console.warn("💡 Then start it: brew services start mongodb-community");
    }
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

