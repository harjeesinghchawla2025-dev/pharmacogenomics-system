
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../db.js";

const router = Router();

router.post("/register", async (req, res) => {
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
      !firstName?.trim() ||
      !email?.trim() ||
      typeof password !== "string" ||
      password.length < 8
    ) {
      return res.status(400).json({
        message: "Name, email and password (8+ characters) are required.",
      });
    }

    if (phone && !/^\d{10}$/.test(phone)) {
      return res.status(400).json({
        message: "Phone number must contain exactly 10 digits.",
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

    const [roles] = await pool.execute(
      "SELECT role_id FROM Roles WHERE role_name = 'Patient'"
    );

    if (!roles.length) {
      return res.status(500).json({
        message: "Patient role is missing from the database.",
      });
    }

    // Student ID is accepted by the form but only saved if your schema
    // has a student_id column in Users. We check the schema first below.
    const passwordHash = await bcrypt.hash(password, 12);
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [user] = await connection.execute(
        `INSERT INTO Users
         (email, password_hash, role_id, account_status)
         VALUES (?, ?, ?, 'Active')`,
        [normalizedEmail, passwordHash, roles[0].role_id]
      );

      await connection.execute(
        `INSERT INTO User_Profile
         (user_id, first_name, last_name, phone)
         VALUES (?, ?, ?, ?)`,
        [
          user.insertId,
          firstName.trim(),
          lastName?.trim() || null,
          phone || null,
        ]
      );

      await connection.commit();

      return res.status(201).json({
        message: "Registration successful. Please log in.",
        studentIdReceived: Boolean(studentId),
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Registration error:", error.message);

    return res.status(500).json({
      message: "Registration failed. Check your details and database.",
    });
  }
});

router.post("/login", async (req, res) => {
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
      console.error("JWT_SECRET is missing.");
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

    if (
      !users.length ||
      !(await bcrypt.compare(password, users[0].password_hash)) ||
      users[0].account_status !== "Active"
    ) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const user = users[0];

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
