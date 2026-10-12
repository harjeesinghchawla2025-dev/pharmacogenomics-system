
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../db.js";

const router = Router();

router.post("/register", async (req, res) => {
  let connection;

  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      studentId,
    } = req.body;

    if (
      typeof firstName !== "string" ||
      !firstName.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      password.length < 8
    ) {
      return res.status(400).json({
        message: "Name, email and password (8+ characters) are required.",
      });
    }

    if (
      studentId &&
      (typeof studentId !== "string" || studentId.trim().length > 20)
    ) {
      return res.status(400).json({
        message: "Student ID must be 20 characters or fewer.",
      });
    }

    if (phone && !/^\d{10}$/.test(phone)) {
      return res.status(400).json({
        message: "Phone number must contain exactly 10 digits.",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        message: "Server authentication is not configured.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const [existing] = await pool.execute(
      "SELECT user_id FROM Users WHERE email = ?",
      [normalizedEmail]
    );

    if (existing.length) {
      return res.status(409).json({
        message: "Email already registered.",
      });
    }

    if (studentId?.trim()) {
      const [existingStudent] = await pool.execute(
        "SELECT user_id FROM Users WHERE student_id = ?",
        [studentId.trim()]
      );

      if (existingStudent.length) {
        return res.status(409).json({
          message: "Student ID already registered.",
        });
      }
    }

    const [roles] = await pool.execute(
      "SELECT role_id FROM Roles WHERE role_name = 'Patient'"
    );

    if (!roles.length) {
      return res.status(500).json({
        message: "Patient role is missing from the database.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [user] = await connection.execute(
      `INSERT INTO Users
       (student_id, email, password_hash, role_id, account_status)
       VALUES (?, ?, ?, ?, 'Active')`,
      [
        studentId?.trim() || null,
        normalizedEmail,
        passwordHash,
        roles[0].role_id,
      ]
    );

    await connection.execute(
      `INSERT INTO User_Profile
       (user_id, first_name, last_name, phone)
       VALUES (?, ?, ?, ?)`,
      [
        user.insertId,
        firstName.trim(),
        typeof lastName === "string" ? lastName.trim() || null : null,
        phone || null,
      ]
    );

    await connection.commit();

    return res.status(201).json({
      message: "Registration successful. Please log in.",
    });
  } catch (error) {
    if (connection) {
      await connection.rollback().catch(() => {});
    }

    console.error("Registration error:", error.message);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Email or student ID is already registered.",
      });
    }

    return res.status(500).json({
      message: "Registration failed. Check your server and database.",
    });
  } finally {
    if (connection) connection.release();
  }
});

router.post("/login", async (req, res) => {
  let userId = null;
  let connection;

  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        message: "Server authentication is not configured.",
      });
    }

    const [users] = await pool.execute(
      `SELECT u.user_id, u.email, u.password_hash,
              u.account_status, r.role_name
       FROM Users u
       JOIN Roles r ON u.role_id = r.role_id
       WHERE u.email = ?`,
      [email.trim().toLowerCase()]
    );

    const user = users[0];
    userId = user?.user_id ?? null;

    const passwordMatches = user
      ? await bcrypt.compare(password, user.password_hash)
      : false;

    const success =
      Boolean(user) &&
      passwordMatches &&
      user.account_status === "Active";

    // Record login attempts for known users.
    if (userId !== null) {
      await pool.execute(
        `INSERT INTO Login_History (user_id, login_status)
         VALUES (?, ?)`,
        [userId, success ? "Success" : "Failed"]
      );
    }

    if (!success) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const token = jwt.sign(
      {
        userId: user.user_id,
        role: user.role_name,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.json({
      message: "Login successful.",
      token,
      user: {
        userId: user.user_id,
        email: user.email,
        role: user.role_name,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      message: "Login failed. Check your server configuration.",
    });
  }
});

export default router;
