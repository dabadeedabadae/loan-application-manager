// Loan applications REST routes.
// Implements CRUD operations under /api/loans with proper validation
// and parameterized SQL queries to prevent injection attacks.
const express = require("express");
const pool = require("../db");

const router = express.Router();

// GET /api/loans — list all loan applications ordered by id
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM loan_applications ORDER BY id"
    );
    return res.status(200).json(result.rows);
  } catch (err) {
    return res.status(500).json({ error: "Database error" });
  }
});

// GET /api/loans/:id — return a single loan application
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  // Validate that id is a number
  if (isNaN(Number(id))) {
    return res.status(400).json({ error: "Invalid id, must be a number" });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM loan_applications WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Loan application not found" });
    }

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: "Database error" });
  }
});

// POST /api/loans — create a new loan application
router.post("/", async (req, res) => {
  const { applicant_name, loan_amount, interest_rate } = req.body;

  // Required-field validation
  if (
    applicant_name === undefined ||
    loan_amount === undefined ||
    interest_rate === undefined
  ) {
    return res.status(400).json({
      error:
        "Missing required fields: applicant_name, loan_amount, interest_rate"
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO loan_applications (applicant_name, loan_amount, interest_rate)
       VALUES ($1, $2, $3) RETURNING *`,
      [applicant_name, loan_amount, interest_rate]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: "Database error" });
  }
});

// PUT /api/loans/:id — update a loan application
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { applicant_name, loan_amount, interest_rate, status } = req.body;

  if (isNaN(Number(id))) {
    return res.status(400).json({ error: "Invalid id, must be a number" });
  }

  try {
    const result = await pool.query(
      `UPDATE loan_applications
       SET applicant_name = COALESCE($1, applicant_name),
           loan_amount    = COALESCE($2, loan_amount),
           interest_rate  = COALESCE($3, interest_rate),
           status         = COALESCE($4, status)
       WHERE id = $5
       RETURNING *`,
      [applicant_name, loan_amount, interest_rate, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Loan application not found" });
    }

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: "Database error" });
  }
});

// DELETE /api/loans/:id — delete a loan application
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  if (isNaN(Number(id))) {
    return res.status(400).json({ error: "Invalid id, must be a number" });
  }

  try {
    const result = await pool.query(
      "DELETE FROM loan_applications WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Loan application not found" });
    }

    return res.status(200).json({ message: "Loan application deleted" });
  } catch (err) {
    return res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;
