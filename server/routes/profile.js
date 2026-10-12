
import { Router } from "express";
import pool from "../db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

// GET: View the logged-in user's profile
router.get("/", authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT
         u.user_id,
         u.email,
         u.student_id,
         u.account_status,
         r.role_name,
         p.first_name,
         p.last_name,
         p.phone,
         p.date_of_birth,
         p.gender,
         p.address
       FROM Users u
       JOIN Roles r ON r.role_id = u.role_id
       LEFT JOIN User_Profile p ON p.user_id = u.user_id
       WHERE u.user_id = ?`,
      [req.user.userId]
    );

    if (!rows.length) {
      return res.status(404).json({
        message: "Profile not found.",
      });
    }

    res.json({ user: rows[0] });
  } catch (error) {
    console.error("Profile error:", error.message);

    res.status(500).json({
      message: "Could not load profile.",
    });
  }
});

// PUT: Update the logged-in user's profile
router.put("/", authenticateToken, async (req, res) => {
  try {
    const {
      firstName,
      lastName = "",
      phone = "",
      dateOfBirth = null,
      gender = null,
      address = "",
    } = req.body;

    if (
      typeof firstName !== "string" ||
      !firstName.trim() ||
      firstName.trim().length > 50 ||
      typeof lastName !== "string" ||
      lastName.length > 50 ||
      typeof phone !== "string" ||
      phone.length > 20 ||
      typeof address !== "string" ||
      address.length > 255
    ) {
      return res.status(400).json({
        message: "Please enter valid profile details.",
      });
    }

    if (phone && !/^\+?[0-9]{10,15}$/.test(phone)) {
      return res.status(400).json({
        message: "Enter a valid phone number.",
      });
    }

    const allowedGenders = [
      null,
      "Male",
      "Female",
      "Other",
      "Prefer not to say",
    ];

    if (!allowedGenders.includes(gender)) {
      return res.status(400).json({
        message: "Invalid gender selection.",
      });
    }

    if (
      dateOfBirth !== null &&
      (
        typeof dateOfBirth !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth) ||
        Number.isNaN(Date.parse(dateOfBirth)) ||
        new Date(dateOfBirth).toISOString().slice(0, 10) !== dateOfBirth ||
        dateOfBirth > new Date().toISOString().slice(0, 10)
      )
    ) {
      return res.status(400).json({
        message: "Enter a valid date of birth.",
      });
    }

    const [result] = await pool.execute(
      `UPDATE User_Profile
       SET first_name = ?,
           last_name = ?,
           phone = ?,
           date_of_birth = ?,
           gender = ?,
           address = ?
       WHERE user_id = ?`,
      [
        firstName.trim(),
        lastName.trim() || null,
        phone.trim() || null,
        dateOfBirth,
        gender,
        address.trim() || null,
        req.user.userId,
      ]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        message: "Profile not found.",
      });
    }

    res.json({
      message: "Profile updated successfully.",
    });
  } catch (error) {
    console.error("Profile update error:", error.message);

    res.status(500).json({
      message: "Could not update profile.",
    });
  }
});

export default router;

