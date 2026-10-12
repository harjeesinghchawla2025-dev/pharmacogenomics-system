
import jwt from "jsonwebtoken";
import pool from "../db.js";

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({
      message: "Please log in to continue.",
    });
  }

  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is missing.");

    return res.status(500).json({
      message: "Server authentication is not configured.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.userId) {
      return res.status(401).json({
        message: "Invalid authentication token.",
      });
    }

    const [rows] = await pool.execute(
      `SELECT
         u.user_id,
         u.email,
         u.account_status,
         r.role_name
       FROM Users u
       JOIN Roles r ON r.role_id = u.role_id
       WHERE u.user_id = ?`,
      [decoded.userId]
    );

    if (!rows.length || rows[0].account_status !== "Active") {
      return res.status(401).json({
        message: "Your account is inactive or unavailable.",
      });
    }

    req.user = {
      userId: rows[0].user_id,
      email: rows[0].email,
      role: rows[0].role_name,
    };

    return next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        message: "Your session is invalid or expired. Please log in again.",
      });
    }

    console.error("Authentication error:", error.message);

    return res.status(500).json({
      message: "Could not verify your session.",
    });
  }
}

export function allowRoles(...allowedRoles) {
  return (req, res, next) => {
    if (
      !req.user ||
      !allowedRoles.includes(req.user.role)
    ) {
      return res.status(403).json({
        message: "You do not have permission to access this resource.",
      });
    }

    return next();
  };
}

