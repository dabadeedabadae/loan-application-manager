// Cypress configuration. Sets the baseUrl so cy.visit("/") hits the dev server.
const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    specPattern: "cypress/e2e/**/*.cy.js",
    supportFile: false
  }
});
