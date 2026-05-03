// Express application entry point.
// Exports `app` so Supertest can drive it during Jest tests
// without binding to a real port.
const express = require("express");
const path = require("path");
const loansRouter = require("./routes/loans");

const app = express();

// Built-in middleware: JSON body parsing + static file serving
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Mount the loans router under /api/loans
app.use("/api/loans", loansRouter);

const PORT = process.env.PORT || 3000;

// Only bind to a port outside of the Jest test environment
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Loan application server listening on port ${PORT}`);
  });
}

module.exports = { app };
