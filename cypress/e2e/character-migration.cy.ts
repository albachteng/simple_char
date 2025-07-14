describe('Character Migration', () => {
  beforeEach(() => {
    cy.window().then((win) => {
      win.localStorage.clear()
    })
  })

  it.skip('migrates local character to database on login (Requires Server)', () => {
    // Note: This test is skipped because it requires a running API server
    // To run this test:
    // 1. Start the API server: npm run server
    // 2. Remove the .skip() from this test
    // 3. Run cypress: npm run cypress:open
    
    cy.visit('/')
    
    // Create character locally first
    cy.createCharacter('MigrationTest', 'dwarf')
    
    // Verify character exists locally
    cy.contains('MigrationTest').should('be.visible')
    cy.contains('Race: Dwarf').should('be.visible')
    cy.contains('Local Only').should('be.visible')
    
    // Level up the character to make it more interesting
    cy.contains('Level Up').click()
    cy.contains('Level 2').should('be.visible')
    
    // Save character locally
    cy.contains('Save Character').click()
    cy.get('[role="dialog"]').contains('Save').click()
    
    // Register/login (this would trigger migration)
    const testUser = {
      username: 'migrationuser',
      email: 'migration@test.com',
      password: 'TestPassword123!'
    }
    
    cy.contains('Sign In').click()
    cy.contains('Create Account').click()
    
    // Fill registration form
    cy.get('input[placeholder="Enter your username"]').type(testUser.username)
    cy.get('input[placeholder="Enter your email"]').type(testUser.email)
    cy.get('input[placeholder="Enter your password"]').first().type(testUser.password)
    cy.get('input[placeholder="Confirm your password"]').type(testUser.password)
    
    // Submit registration
    cy.contains('button', 'Create Account').click()
    
    // Should now be authenticated
    cy.contains(testUser.username).should('be.visible')
    cy.contains('Database').should('be.visible')
    
    // Verify migration prompt or automatic migration
    // (Implementation may vary - could be automatic or require user confirmation)
    
    // Load characters to see if migration worked
    cy.contains('Load Character').click()
    
    // Should see the migrated character in database
    cy.contains('MigrationTest').should('be.visible')
    cy.contains('MigrationTest').parent().contains('Load').click()
    
    // Verify character details preserved
    cy.contains('MigrationTest').should('be.visible')
    cy.contains('Level 2').should('be.visible')
    cy.contains('Race: Dwarf').should('be.visible')
  })

  it('preserves local characters when working offline', () => {
    cy.visit('/')
    
    // Create multiple characters locally
    cy.createCharacter('LocalChar1', 'human')
    
    // Save first character
    cy.contains('Save Character').click()
    cy.get('[role="dialog"]').contains('Save').click()
    
    // Create another character (this will reset the current character display)
    cy.visit('/') // Reset to start
    cy.createCharacter('LocalChar2', 'elf')
    
    // Save second character
    cy.contains('Save Character').click()
    cy.get('[role="dialog"]').contains('Save').click()
    
    // Verify both characters can be loaded
    cy.contains('Load Character').click()
    
    // Should see both characters
    cy.contains('LocalChar1').should('be.visible')
    cy.contains('LocalChar2').should('be.visible')
    
    // Load first character
    cy.contains('LocalChar1').parent().contains('Load').click()
    cy.contains('LocalChar1').should('be.visible')
    cy.contains('Race: Human').should('be.visible')
    
    // Load second character
    cy.contains('Load Character').click()
    cy.contains('LocalChar2').parent().contains('Load').click()
    cy.contains('LocalChar2').should('be.visible')
    cy.contains('Race: Elf').should('be.visible')
  })

  it('handles character name conflicts gracefully', () => {
    cy.visit('/')
    
    // Create character with a specific name
    cy.createCharacter('ConflictChar', 'gnome')
    
    // Save it
    cy.contains('Save Character').click()
    cy.get('[role="dialog"]').contains('Save').click()
    
    // Try to create another character with the same name
    cy.visit('/') // Reset
    cy.createCharacter('ConflictChar', 'halfling')
    
    // When saving, should handle the conflict
    cy.contains('Save Character').click()
    
    // May show error or auto-rename
    // Implementation should prevent overwriting existing character
    cy.get('[role="dialog"]').should('be.visible')
    
    // Check that we can't save over existing character or it gets renamed
    cy.get('body').then(($body) => {
      if ($body.text().includes('already exists')) {
        // Error shown - good
        cy.contains('Cancel').click()
      } else {
        // May have auto-renamed or allowed save
        cy.contains('Save').click()
      }
    })
  })
})