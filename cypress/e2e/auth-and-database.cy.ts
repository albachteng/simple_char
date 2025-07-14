describe('Authentication & Database Integration', () => {
  beforeEach(() => {
    // Clear localStorage and ensure clean state
    cy.window().then((win) => {
      win.localStorage.clear()
    })
    cy.visit('/')
  })

  it('registers, creates character, and saves to database (Requires Server)', () => {
    // Note: This test is skipped because it requires a running API server
    // To run this test:
    // 1. Start the API server: npm run server
    // 2. Remove the .skip() from this test
    // 3. Run cypress: npm run cypress:open
    
    const testUser = {
      username: 'cypressuser',
      email: 'cypress@test.com',
      password: 'TestPassword123!'
    }

    // Register new user
    cy.contains('Sign In').click()
    
    // Switch to registration mode
    cy.contains('Create Account').click()
    
    // Fill registration form
    cy.get('input[placeholder="Enter your username"]').type(testUser.username)
    cy.get('input[placeholder="Enter your email"]').type(testUser.email)
    cy.get('input[placeholder="Enter your password"]').first().type(testUser.password)
    cy.get('input[placeholder="Confirm your password"]').type(testUser.password)
    
    // Submit registration
    cy.contains('button', 'Create Account').click()
    
    // Verify authentication success
    cy.contains('Registration successful!').should('be.visible')
    cy.contains(testUser.username).should('be.visible')
    
    // Create character
    cy.createCharacter('DatabaseChar', 'elf')
    
    // Verify character was created
    cy.contains('DatabaseChar').should('be.visible')
    cy.contains('Level 1').should('be.visible')
    cy.contains('Race: Elf').should('be.visible')
    
    // Add database equipment templates (if available)
    cy.contains('Add Item').click()
    cy.contains('Database Templates').click()
    
    // If templates are available, add one
    cy.get('body').then(($body) => {
      if ($body.text().includes('Add')) {
        cy.contains('Add').first().click()
      } else {
        // Close modal if no templates
        cy.get('[aria-label="Close"]').click()
      }
    })
    
    // Save to database
    cy.contains('Save Character').click()
    cy.get('[role="dialog"]').contains('Save').click()
    
    // Logout and login to verify persistence
    cy.contains(testUser.username).click()
    cy.contains('Sign Out').click()
    
    // Login again
    cy.contains('Sign In').click()
    cy.get('input[placeholder="Enter your email or username"]').type(testUser.username)
    cy.get('input[placeholder="Enter your password"]').type(testUser.password)
    cy.contains('button', 'Sign In').click()
    
    // Verify character loads from database
    cy.contains('Load Saved Character').click()
    cy.contains('DatabaseChar').should('be.visible')
    cy.contains('DatabaseChar').parent().contains('Load').click()
    
    // Verify character details
    cy.contains('DatabaseChar').should('be.visible')
    cy.contains('Race: Elf').should('be.visible')
  })

  it('shows authentication status and storage mode correctly', () => {
    // Should start unauthenticated
    cy.contains('Sign In').should('be.visible')
    cy.contains('Local Only').should('be.visible')
    
    // Test character creation in local mode
    cy.createCharacter('LocalTestChar', 'human')
    
    // Should show character was created
    cy.contains('LocalTestChar').should('be.visible')
    cy.contains('Race: Human').should('be.visible')
    
    // Storage should still be local only
    cy.contains('Local Only').should('be.visible')
  })

  it('handles authentication modal interactions', () => {
    // Open auth modal
    cy.contains('Sign In').click()
    
    // Should show login form (wait for modal animation)
    cy.get('[role="dialog"]').should('be.visible')
    cy.wait(500) // Wait for modal animation
    cy.get('input[placeholder="Enter your email or username"]').should('be.visible')
    cy.get('input[placeholder="Enter your password"]').should('be.visible')
    
    // Switch to registration
    cy.contains('Create Account').click()
    
    // Should show registration form
    cy.get('input[placeholder="Enter your username"]').should('be.visible')
    cy.get('input[placeholder="Enter your email"]').should('be.visible')
    cy.get('input[placeholder="Confirm your password"]').should('be.visible')
    
    // Close modal
    cy.get('[aria-label="Close"]').click()
    cy.get('[role="dialog"]').should('not.exist')
  })
})
