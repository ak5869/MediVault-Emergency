import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import emergencyRoutes from "./routes/emergencyRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import { cleanupExpiredTokens } from "./controllers/emergencyController.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/auth",      authRoutes);
app.use("/api/patients",  patientRoutes);
app.use("/api/emergency", emergencyRoutes);
app.use("/api/profile",   profileRoutes);

// ─── Health Check ────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "MediVault API is running" });
});

// ─── 404 Fallback ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("[Server Error]", err);
  res.status(500).json({ message: "Internal server error" });
});

// ─── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ MediVault server running on http://localhost:${PORT}`);

  // Run cleanup every 60 seconds to deactivate expired tokens
  setInterval(cleanupExpiredTokens, 60 * 1000);
  cleanupExpiredTokens(); // Run once immediately on startup
  console.log(`🔄 Token cleanup scheduler started (every 60s)`);
});