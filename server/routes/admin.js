import express from "express";
import bcrypt from "bcryptjs";
import pool from "../db.js";

const router = express.Router();

/* -------------------------------------------------- */
/* Database statistics                                */
/* -------------------------------------------------- */

router.get("/stats", async (req, res) => {
  try {
    const [[users]] = await pool.query(
      "SELECT COUNT(*) AS count FROM users"
    );

    const [[patients]] = await pool.query(
      "SELECT COUNT(*) AS count FROM patient"
    );

    const [[doctors]] = await pool.query(
      "SELECT COUNT(*) AS count FROM users WHERE role_id = 2"
    );

    const [[drugs]] = await pool.query(
      "SELECT COUNT(*) AS count FROM drug"
    );

    const [[genes]] = await pool.query(
      "SELECT COUNT(*) AS count FROM gene"
    );

    const [[variants]] = await pool.query(
      "SELECT COUNT(*) AS count FROM genetic_variant"
    );

    const [[recommendations]] = await pool.query(
      "SELECT COUNT(*) AS count FROM recommendation"
    );

    const [[prescriptions]] = await pool.query(
      "SELECT COUNT(*) AS count FROM prescription"
    );

    res.json({
      users: users.count,
      patients: patients.count,
      doctors: doctors.count,
      drugs: drugs.count,
      genes: genes.count,
      variants: variants.count,
      recommendations: recommendations.count,
      prescriptions: prescriptions.count,
    });
  } catch (error) {
    console.error("Stats error:", error);

    res.status(500).json({
      error: error.message,
    });
  }
});
/* -------------------------------------------------- */
/* Recommendations by type                            */
/* -------------------------------------------------- */

router.get("/analytics/recommendations-by-type", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        recommendation_type AS name,
        COUNT(*) AS count
      FROM recommendation
      GROUP BY recommendation_type
      ORDER BY count DESC
    `);

    res.json(rows);
  } catch (error) {
    console.error("Recommendations by type error:", error);

    res.status(500).json({
      error: error.message,
    });
  }
});
/* -------------------------------------------------- */
/* Top drugs by drug-gene interactions                */
/* -------------------------------------------------- */

router.get("/analytics/top-drugs", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        d.drug_name AS name,
        COUNT(*) AS count
      FROM drug_gene_interaction dgi
      JOIN drug d ON d.drug_id = dgi.drug_id
      GROUP BY d.drug_id, d.drug_name
      ORDER BY count DESC
      LIMIT 10
    `);

    res.json(rows);
  } catch (error) {
    console.error("Top drugs error:", error);

    res.status(500).json({
      error: error.message,
    });
  }
});
/* -------------------------------------------------- */
/* Top genes by drug-gene interactions                */
/* -------------------------------------------------- */

router.get("/analytics/top-genes", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        g.gene_symbol AS name,
        COUNT(*) AS count
      FROM drug_gene_interaction dgi
      JOIN gene g ON g.gene_id = dgi.gene_id
      GROUP BY g.gene_id, g.gene_symbol
      ORDER BY count DESC
      LIMIT 10
    `);

    res.json(rows);
  } catch (error) {
    console.error("Top genes error:", error);

    res.status(500).json({
      error: error.message,
    });
  }
});
/* -------------------------------------------------- */
/* Recent recommendations                             */
/* -------------------------------------------------- */

router.get("/recommendations/recent", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        p.patient_code AS patient,
        d.drug_name AS drug,
        g.gene_symbol AS gene,
        v.rs_id AS variant,
        r.recommendation_type AS type,
        r.recommendation_text AS recommendation,
        dgi.source AS source,
        r.status AS status
      FROM recommendation r
      JOIN patient p
        ON p.patient_id = r.patient_id
      JOIN drug d
        ON d.drug_id = r.drug_id
      LEFT JOIN drug_gene_interaction dgi
        ON dgi.interaction_id = r.interaction_id
      LEFT JOIN gene g
        ON g.gene_id = dgi.gene_id
      LEFT JOIN genetic_variant v
        ON v.variant_id = dgi.variant_id
      ORDER BY r.generated_at DESC
      LIMIT 10
    `);

    res.json(rows);
  } catch (error) {
    console.error("Recent recommendations error:", error);

    res.status(500).json({
      error: error.message,
    });
  }
});
/* -------------------------------------------------- */
/* Guideline annotations                              */
/* -------------------------------------------------- */

router.get("/guidelines", async (req, res) => {
  try {
    const drug = req.query.drug;

    const [rows] = await pool.query(
      `
      SELECT
        g.source AS consortium,
        g.guideline_name AS title,
        gd.drug_name AS drug,
        GROUP_CONCAT(
          DISTINCT gg.gene_symbol
          ORDER BY gg.gene_symbol
          SEPARATOR ','
        ) AS genes
      FROM guideline g
      JOIN guideline_drug gd
        ON gd.guideline_id = g.guideline_id
      LEFT JOIN guideline_gene gg
        ON gg.guideline_id = g.guideline_id
      WHERE (? IS NULL OR ? = '' OR LOWER(gd.drug_name) = LOWER(?))
      GROUP BY
        g.guideline_id,
        g.source,
        g.guideline_name,
        gd.drug_name
      ORDER BY g.source, gd.drug_name
      `,
      [drug ?? null, drug ?? null, drug ?? null]
    );

    const formatted = rows.map((row) => ({
      consortium: row.consortium,
      title: row.title,
      drug: row.drug,
      genes: row.genes ? row.genes.split(",") : [],
    }));

    res.json(formatted);
  } catch (error) {
    console.error("Guidelines error:", error);

    res.status(500).json({
      error: error.message,
    });
  }
});
/* -------------------------------------------------- */
/* User management                                    */
/* -------------------------------------------------- */

router.get("/users", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        u.user_id AS id,
        u.student_id AS studentId,
        u.email,
        r.role_name AS role,
        u.account_status AS status,
        u.created_at AS createdAt
      FROM users u
      JOIN roles r ON r.role_id = u.role_id
      ORDER BY u.created_at DESC
    `);

    res.json(rows);
  } catch (error) {
    console.error("Users error:", error);

    res.status(500).json({
      error: error.message,
    });
  }
});
/* -------------------------------------------------- */
/* Create user                                        */
/* -------------------------------------------------- */

router.post("/users", async (req, res) => {
  try {
    const {
      studentId,
      email,
      password,
      roleId,
      accountStatus = "Active",
    } = req.body;

    if (!email || !password || !roleId) {
      return res.status(400).json({
        error: "Email, password and role are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters",
      });
    }

    const [roleRows] = await pool.query(
      "SELECT role_id FROM roles WHERE role_id = ?",
      [roleId]
    );

    if (roleRows.length === 0) {
      return res.status(400).json({
        error: "Invalid role",
      });
    }

    const [existing] = await pool.query(
      `
      SELECT user_id
      FROM users
      WHERE email = ?
         OR (? IS NOT NULL AND student_id = ?)
      LIMIT 1
      `,
      [email, studentId ?? null, studentId ?? null]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        error: "A user with this email or student ID already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [result] = await pool.query(
      `
      INSERT INTO users
        (student_id, email, password_hash, role_id, account_status)
      VALUES
        (?, ?, ?, ?, ?)
      `,
      [
        studentId ?? null,
        email,
        passwordHash,
        roleId,
        accountStatus,
      ]
    );

    res.status(201).json({
      success: true,
      message: "User created successfully",
      userId: result.insertId,
    });
  } catch (error) {
    console.error("Create user error:", error);

    res.status(500).json({
      error: error.message,
    });
  }
});

/* -------------------------------------------------- */
/* Update user                                        */
/* -------------------------------------------------- */

router.put("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      studentId,
      email,
      roleId,
      accountStatus,
    } = req.body;

    if (!email || !roleId || !accountStatus) {
      return res.status(400).json({
        error: "Email, role and account status are required",
      });
    }

    const [roleRows] = await pool.query(
      "SELECT role_id FROM roles WHERE role_id = ?",
      [roleId]
    );

    if (roleRows.length === 0) {
      return res.status(400).json({
        error: "Invalid role",
      });
    }

    const [result] = await pool.query(
      `
      UPDATE users
      SET
        student_id = ?,
        email = ?,
        role_id = ?,
        account_status = ?
      WHERE user_id = ?
      `,
      [
        studentId ?? null,
        email,
        roleId,
        accountStatus,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("Update user error:", error);

    res.status(500).json({
      error: error.message,
    });
  }
});

/* -------------------------------------------------- */
/* Update account status                              */
/* -------------------------------------------------- */

router.patch("/users/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "Active",
      "Inactive",
      "Pending",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: "Invalid account status",
      });
    }

    const [result] = await pool.query(
      `
      UPDATE users
      SET account_status = ?
      WHERE user_id = ?
      `,
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    res.json({
      success: true,
      message: "Account status updated successfully",
    });
  } catch (error) {
    console.error("Update status error:", error);

    res.status(500).json({
      error: error.message,
    });
  }
});
export default router;