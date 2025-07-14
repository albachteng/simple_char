import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    supportFile: 'cypress/support/e2e.ts',
    videosFolder: 'cypress/videos',
    screenshotsFolder: 'cypress/screenshots',
    pageLoadTimeout: 30000,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    env: {
      API_URL: 'http://localhost:3001'
    },
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
})