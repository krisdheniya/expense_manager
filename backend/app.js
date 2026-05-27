import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const app = express();

// ── Security & Core Middlewares ──────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN === "*" 
    ? true  // 'true' reflects the request origin, works with credentials
    : process.env.CORS_ORIGIN,
  credentials: true
}));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// ── Route Imports ────────────────────────────────────────────
import userRoutes from "./routes/userRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import settlementRoutes from "./routes/settlementRoutes.js";

// ── Route Registration ──────────────────────────────────────
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/groups", groupRoutes);
app.use("/api/v1/groups/:groupId/expenses", expenseRoutes);
app.use("/api/v1/groups/:groupId/settlements", settlementRoutes);

// ── Health Check ─────────────────────────────────────────────
app.get("/api/v1/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is running",
        timestamp: new Date().toISOString()
    });
});

// ── Error Handling Middleware (must be last) ──────────────────
import { errorHandler } from "./middleware/error.middleware.js";
app.use(errorHandler);

export default app;
