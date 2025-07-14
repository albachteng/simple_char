/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login a user
       * @example cy.login('testuser', 'password123')
       */
      login(username: string, password: string): Chainable<void>
      
      /**
       * Custom command to create a character
       * @example cy.createCharacter('TestChar', 'human')
       */
      createCharacter(name: string, race: string): Chainable<void>
      
      /**
       * Custom command to add equipment to character
       * @example cy.addEquipment('Iron Sword')
       */
      addEquipment(itemName: string): Chainable<void>
    }
  }
}

Cypress.Commands.add('login', (username: string, password: string) => {
  cy.visit('/')
  
  // Open auth modal
  cy.contains('Sign In').click()
  
  // Fill login form
  cy.get('input[placeholder="Enter your email or username"]').type(username)
  cy.get('input[placeholder="Enter your password"]').type(password)
  
  // Submit login
  cy.get('button').contains('Sign In').click()
  
  // Wait for successful login
  cy.contains('Login successful!').should('be.visible')
})

Cypress.Commands.add('createCharacter', (name: string, race: string) => {
  // Wait for page to be ready and ensure we're on stat selection
  cy.contains('Pick your primary stat').should('be.visible')
  
  // Select primary stat (STR)
  cy.contains('STR primary?').click()
  
  // Wait for secondary stat selection to appear
  cy.contains('Pick your secondary stat').should('be.visible')
  
  // Select secondary stat (DEX)  
  cy.contains('DEX secondary?').click()
  
  // Handle stat bonus selection (appears after picking primary/secondary stats)
  cy.wait(1000) // Let UI settle
  cy.contains('Choose Stat for Bonus').should('be.visible')
  cy.contains('STR (+1)').click()
  
  // Should now show race selection
  cy.contains('Choose Your Race').should('be.visible')
  
  // Choose race
  cy.contains(race, { matchCase: false }).click()
  
  // Enter character name (look for input that might have different placeholder)
  cy.get('input').then(($inputs) => {
    if ($inputs.length > 0) {
      cy.get('input').first().clear().type(name)
    }
  })
  
  // Confirm character creation
  cy.get('body').then(($body) => {
    if ($body.text().includes('Create Character')) {
      cy.contains('Create Character').click()
    }
  })
})

Cypress.Commands.add('addEquipment', (itemName: string) => {
  // Open add item modal
  cy.contains('Add Item').click()
  
  // Find and add the item
  cy.contains(itemName).parent().contains('Add').click()
  
  // Modal should close
  cy.get('[role="dialog"]').should('not.exist')
})

export {}