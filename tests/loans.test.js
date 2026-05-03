// Jest + Supertest unit tests for the loan API.
// The pg module is mocked at the top so tests run without a real PostgreSQL.
jest.mock("pg", () => {
  const mClient = { query: jest.fn(), end: jest.fn() };
  return { Pool: jest.fn(() => mClient) };
});

process.env.NODE_ENV = "test";

const request = require("supertest");
const { Pool } = require("pg");
const { app } = require("../server");

// Single mock pool instance shared across tests
const pool = new Pool();

beforeEach(() => {
  pool.query.mockReset();
});

describe("Loan applications API", () => {

  // 1
  test("getAll_whenLoansExist_returns200WithLoans", async () => {
    const fake = [
      { id: 1, applicant_name: "Alice", loan_amount: "1000.00", interest_rate: "5.00", status: "pending", created_at: "2026-01-01" }
    ];
    pool.query.mockResolvedValueOnce({ rows: fake });

    const res = await request(app).get("/api/loans");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(fake);
    expect(pool.query).toHaveBeenCalledWith("SELECT * FROM loan_applications ORDER BY id");
  });

  // 2
  test("getAll_whenDbFails_returns500", async () => {
    pool.query.mockRejectedValueOnce(new Error("db down"));

    const res = await request(app).get("/api/loans");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Database error" });
  });

  // 3
  test("getById_whenLoanFound_returns200WithLoan", async () => {
    const loan = { id: 5, applicant_name: "Bob", loan_amount: "2000.00", interest_rate: "4.00", status: "approved" };
    pool.query.mockResolvedValueOnce({ rows: [loan] });

    const res = await request(app).get("/api/loans/5");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(loan);
  });

  // 4
  test("getById_whenLoanNotFound_returns404", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get("/api/loans/9999");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Loan application not found" });
  });

  // 5
  test("getById_whenIdNotANumber_returns400", async () => {
    const res = await request(app).get("/api/loans/abc");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Invalid id, must be a number" });
    expect(pool.query).not.toHaveBeenCalled();
  });

  // 6
  test("getById_whenDbFails_returns500", async () => {
    pool.query.mockRejectedValueOnce(new Error("db down"));

    const res = await request(app).get("/api/loans/1");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Database error" });
  });

  // 7
  test("create_whenValidPayload_returns201WithCreatedLoan", async () => {
    const created = { id: 10, applicant_name: "Carol", loan_amount: "5000.00", interest_rate: "6.50", status: "pending" };
    pool.query.mockResolvedValueOnce({ rows: [created] });

    const res = await request(app)
      .post("/api/loans")
      .send({ applicant_name: "Carol", loan_amount: 5000, interest_rate: 6.5 });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(created);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO loan_applications"),
      ["Carol", 5000, 6.5]
    );
  });

  // 8
  test("create_whenRequiredFieldsMissing_returns400", async () => {
    const res = await request(app)
      .post("/api/loans")
      .send({ applicant_name: "Carol" }); // missing amount + rate

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Missing required fields/);
    expect(pool.query).not.toHaveBeenCalled();
  });

  // 9
  test("create_whenDbFails_returns500", async () => {
    pool.query.mockRejectedValueOnce(new Error("db down"));

    const res = await request(app)
      .post("/api/loans")
      .send({ applicant_name: "Dan", loan_amount: 1000, interest_rate: 3 });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Database error" });
  });

  // 10
  test("update_whenLoanFound_returns200WithUpdatedLoan", async () => {
    const updated = { id: 3, applicant_name: "Eve", loan_amount: "1500.00", interest_rate: "4.25", status: "approved" };
    pool.query.mockResolvedValueOnce({ rows: [updated] });

    const res = await request(app)
      .put("/api/loans/3")
      .send({ status: "approved" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(updated);
  });

  // 11
  test("update_whenLoanNotFound_returns404", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .put("/api/loans/9999")
      .send({ status: "approved" });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Loan application not found" });
  });

  // 12
  test("delete_whenLoanFound_returns200WithSuccessMessage", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 7 }] });

    const res = await request(app).delete("/api/loans/7");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Loan application deleted" });
  });

});
