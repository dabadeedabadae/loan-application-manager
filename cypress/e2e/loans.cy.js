// Cypress end-to-end tests for the loan application UI.
// API calls are stubbed with cy.intercept() so the tests don't need a real DB.

describe("Loan Application UI", () => {

  // Sample data used by stubbed API responses
  const sampleLoans = [
    {
      id: 1,
      applicant_name: "Alice Johnson",
      loan_amount: "1000.00",
      interest_rate: "5.00",
      status: "pending",
      created_at: "2026-01-15T10:00:00Z"
    },
    {
      id: 2,
      applicant_name: "Bob Smith",
      loan_amount: "2500.00",
      interest_rate: "4.50",
      status: "approved",
      created_at: "2026-02-10T12:00:00Z"
    }
  ];

  beforeEach(() => {
    // Default GET stub used by every test
    cy.intercept("GET", "/api/loans", { statusCode: 200, body: sampleLoans }).as("getLoans");
    cy.visit("/");
    cy.wait("@getLoans");
  });

  // 1
  it("loads_whenPageOpens_displaysLoanTable", () => {
    cy.get('[data-cy="loan-table"]').should("be.visible");
  });

  // 2
  it("formIsVisible_whenPageOpens_showsAllInputs", () => {
    cy.get('[data-cy="applicant-name-input"]').should("be.visible");
    cy.get('[data-cy="loan-amount-input"]').should("be.visible");
    cy.get('[data-cy="interest-rate-input"]').should("be.visible");
    cy.get('[data-cy="submit-btn"]').should("be.visible");
  });

  // 3
  it("create_whenValidFormSubmitted_newLoanAppearsInTable", () => {
    const newLoan = {
      id: 3,
      applicant_name: "Charlie Davis",
      loan_amount: "7500.00",
      interest_rate: "6.25",
      status: "pending",
      created_at: "2026-03-01T09:00:00Z"
    };

    cy.intercept("POST", "/api/loans", { statusCode: 201, body: newLoan }).as("createLoan");
    cy.intercept("GET", "/api/loans", {
      statusCode: 200,
      body: [...sampleLoans, newLoan]
    }).as("getLoansAfter");

    cy.get('[data-cy="applicant-name-input"]').type("Charlie Davis");
    cy.get('[data-cy="loan-amount-input"]').type("7500");
    cy.get('[data-cy="interest-rate-input"]').type("6.25");
    cy.get('[data-cy="submit-btn"]').click();

    cy.wait("@createLoan");
    cy.wait("@getLoansAfter");

    cy.get('[data-cy="loan-row"]').should("have.length", 3);
    cy.get('[data-cy="loan-table"]').contains("Charlie Davis");
  });

  // 4
  it("create_whenEmptyFormSubmitted_validationPreventsSubmission", () => {
    let postCalled = false;
    cy.intercept("POST", "/api/loans", (req) => {
      postCalled = true;
      req.reply({ statusCode: 400, body: { error: "Missing required fields" } });
    }).as("createLoan");

    cy.get('[data-cy="submit-btn"]').click();

    // Browser-level validation blocks the submit; POST should not have been made
    cy.then(() => {
      expect(postCalled).to.be.false;
    });
    cy.get('[data-cy="loan-row"]').should("have.length", 2);
  });

  // 5
  it("create_whenAmountIsNegative_errorMessageShown", () => {
    cy.get('[data-cy="applicant-name-input"]').type("Negative Test");
    // Browser may reject `-` in number input — set value programmatically
    cy.get('[data-cy="loan-amount-input"]').invoke("val", "-100").trigger("change");
    cy.get('[data-cy="interest-rate-input"]').type("5");
    cy.get('[data-cy="submit-btn"]').click();

    cy.get('[data-cy="error-message"]').should("be.visible");
    cy.get('[data-cy="error-message"]').should("contain.text", "greater than 0");
  });

  // 6
  it("list_afterCreatingLoan_listIsNotEmpty", () => {
    cy.get('[data-cy="loan-row"]').its("length").should("be.greaterThan", 0);
  });

  // 7
  it("edit_whenEditClicked_formFillsWithLoanData", () => {
    cy.get('[data-cy="loan-row"]').first().find('[data-cy="edit-btn"]').click();

    cy.get('[data-cy="applicant-name-input"]').should("have.value", "Alice Johnson");
    cy.get('[data-cy="loan-amount-input"]').should("have.value", "1000.00");
    cy.get('[data-cy="interest-rate-input"]').should("have.value", "5.00");
    cy.get('[data-cy="submit-btn"]').should("contain.text", "Update");
  });

  // 8
  it("update_whenLoanEdited_tableUpdatesWithNewValues", () => {
    const updated = {
      id: 1,
      applicant_name: "Alice Renamed",
      loan_amount: "1500.00",
      interest_rate: "5.50",
      status: "pending",
      created_at: "2026-01-15T10:00:00Z"
    };

    cy.intercept("PUT", "/api/loans/1", { statusCode: 200, body: updated }).as("updateLoan");
    cy.intercept("GET", "/api/loans", {
      statusCode: 200,
      body: [updated, sampleLoans[1]]
    }).as("getLoansAfter");

    cy.get('[data-cy="loan-row"]').first().find('[data-cy="edit-btn"]').click();
    cy.get('[data-cy="applicant-name-input"]').clear().type("Alice Renamed");
    cy.get('[data-cy="loan-amount-input"]').clear().type("1500");
    cy.get('[data-cy="interest-rate-input"]').clear().type("5.5");
    cy.get('[data-cy="submit-btn"]').click();

    cy.wait("@updateLoan");
    cy.wait("@getLoansAfter");

    cy.get('[data-cy="loan-table"]').contains("Alice Renamed");
  });

  // 9
  it("delete_whenDeleteClicked_loanIsRemovedFromTable", () => {
    cy.intercept("DELETE", "/api/loans/1", {
      statusCode: 200,
      body: { message: "Loan application deleted" }
    }).as("deleteLoan");

    cy.intercept("GET", "/api/loans", {
      statusCode: 200,
      body: [sampleLoans[1]]
    }).as("getLoansAfter");

    // Auto-confirm browser confirm() dialog
    cy.on("window:confirm", () => true);

    cy.get('[data-cy="loan-row"]').first().find('[data-cy="delete-btn"]').click();

    cy.wait("@deleteLoan");
    cy.wait("@getLoansAfter");

    cy.get('[data-cy="loan-row"]').should("have.length", 1);
  });

  // 10
  it("delete_afterDeletion_deletedRowNoLongerVisible", () => {
    cy.intercept("DELETE", "/api/loans/1", {
      statusCode: 200,
      body: { message: "Loan application deleted" }
    }).as("deleteLoan");

    cy.intercept("GET", "/api/loans", {
      statusCode: 200,
      body: [sampleLoans[1]]
    }).as("getLoansAfter");

    cy.on("window:confirm", () => true);
    cy.get('[data-cy="loan-row"]').first().find('[data-cy="delete-btn"]').click();
    cy.wait("@deleteLoan");
    cy.wait("@getLoansAfter");

    cy.get('[data-cy="loan-table"]').should("not.contain.text", "Alice Johnson");
  });

  // 11
  it("create_forNewLoan_statusFieldShowsPending", () => {
    const newLoan = {
      id: 99,
      applicant_name: "Pending Person",
      loan_amount: "300.00",
      interest_rate: "3.00",
      status: "pending",
      created_at: "2026-04-01T09:00:00Z"
    };

    cy.intercept("POST", "/api/loans", { statusCode: 201, body: newLoan }).as("createLoan");
    cy.intercept("GET", "/api/loans", {
      statusCode: 200,
      body: [...sampleLoans, newLoan]
    }).as("getLoansAfter");

    cy.get('[data-cy="applicant-name-input"]').type("Pending Person");
    cy.get('[data-cy="loan-amount-input"]').type("300");
    cy.get('[data-cy="interest-rate-input"]').type("3");
    cy.get('[data-cy="submit-btn"]').click();

    cy.wait("@createLoan");
    cy.wait("@getLoansAfter");

    cy.contains('[data-cy="loan-row"]', "Pending Person").should("contain.text", "pending");
  });

  // 12
  it("table_whenPageLoaded_showsCorrectColumnHeaders", () => {
    const expectedHeaders = ["ID", "Applicant Name", "Amount", "Interest Rate", "Status"];
    expectedHeaders.forEach(header => {
      cy.get('[data-cy="loan-table"] thead').contains("th", header).should("be.visible");
    });
  });

});
