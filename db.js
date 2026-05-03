// Database connection module.
// Exports a pg.Pool instance configured via environment variables.
// The pool is exported so it can be mocked in unit tests.
require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "loandb",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  port: parseInt(process.env.DB_PORT, 10) || 5432
});

module.exports = pool;
