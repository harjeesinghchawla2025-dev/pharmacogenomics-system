import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./db.js";
import adminRoutes from "./routes/admin.js";

dotenv.config();

const app = express();
app.use(
  cors({
    origin: "http://localhost:8080",
  })
);
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.use("/admin", adminRoutes);

app.get("/api/test-db", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 AS connected");

    res.json({
      success: true,
      message: "MySQL connection successful",
      data: rows,
    });
  } catch (error) {
    console.error("Database error:", error);

    res.status(500).json({
      success: false,
      message: "MySQL connection failed",
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});