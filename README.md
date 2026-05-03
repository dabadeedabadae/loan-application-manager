# Loan Application in a Banking System

A full-stack web application demonstrating CRUD operations for loan applications,
built as a software testing assignment. The project covers unit testing (Jest +
Supertest), end-to-end testing (Cypress), HTTP client testing, and load testing
(Artillery).

## Tech stack

- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL (`pg` driver)
- **Frontend:** Vanilla HTML/CSS/JavaScript (no frameworks)
- **Testing:** Jest, Supertest, Cypress, Artillery

## Project structure

```
loan-app/
├── server.js               # Express app entry point
├── db.js                   # PostgreSQL pool
├── routes/loans.js         # /api/loans CRUD routes
├── public/index.html       # Single-page UI
├── tests/loans.test.js     # Jest + Supertest unit tests (12)
├── cypress/e2e/loans.cy.js # Cypress E2E tests (12)
├── artillery/load-test.yml # Artillery load profile
├── loans.http              # HTTP client requests
├── http-client.env.json    # HTTP client environment
├── jest.config.js
├── cypress.config.js
└── package.json
```

## 1. Set up PostgreSQL

Create the database and table:

```sql
CREATE DATABASE loandb;

\c loandb

CREATE TABLE loan_applications (
  id SERIAL PRIMARY KEY,
  applicant_name VARCHAR(100) NOT NULL,
  loan_amount DECIMAL(12,2) NOT NULL CHECK (loan_amount > 0),
  interest_rate DECIMAL(5,2) NOT NULL CHECK (interest_rate > 0),
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

The default connection settings are read from environment variables (or fall back
to defaults). Copy `.env.example` to `.env` and adjust as needed:

```
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=loandb
DB_USER=postgres
DB_PASSWORD=postgres
```

## 2. Install dependencies

```bash
npm install
```

## 3. Run the application

```bash
npm start
```

Then open <http://localhost:3000> in your browser.

## 4. Run Jest unit tests

```bash
npm test
```

The `pg` module is mocked, so a running PostgreSQL is **not** required for
unit tests. Coverage reports are written to `coverage/`.

## 5. Run Cypress E2E tests

Make sure the dev server is running (`npm start`) and the app is reachable at
`http://localhost:3000`, then:

```bash
npm run test:e2e            # interactive UI
npm run test:e2e:headless   # headless run
```

The Cypress tests stub all `/api/loans` calls with `cy.intercept()`, so they
do not need a live database either.

## 6. Run Artillery load tests

```bash
npm run load-test
```

This runs the three-phase load profile defined in `artillery/load-test.yml`
(warm-up → ramp-up → peak) against the running server.

## 7. HTTP client test file

Open `loans.http` in JetBrains IDEs or VS Code (with the *REST Client*
extension). The active environment is loaded from `http-client.env.json`
(`development` → `baseUrl=http://localhost:3000`).

## API reference

| Method | Path             | Description              | Status codes      |
|--------|------------------|--------------------------|-------------------|
| GET    | `/api/loans`     | List all loans           | 200, 500          |
| GET    | `/api/loans/:id` | Get one loan             | 200, 400, 404, 500|
| POST   | `/api/loans`     | Create a new loan        | 201, 400, 500     |
| PUT    | `/api/loans/:id` | Update a loan            | 200, 400, 404, 500|
| DELETE | `/api/loans/:id` | Delete a loan            | 200, 400, 404, 500|

All error responses are JSON in the form `{ "error": "message" }`.
