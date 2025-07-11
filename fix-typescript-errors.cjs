#!/usr/bin/env node

// Quick script to fix common TypeScript compilation errors
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing TypeScript compilation errors...');

// Function to fix a file
function fixFile(filePath, fixes) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  fixes.forEach(fix => {
    if (content.includes(fix.search)) {
      content = content.replace(new RegExp(fix.search, 'g'), fix.replace);
      modified = true;
      console.log(`✅ Fixed: ${fix.description} in ${path.basename(filePath)}`);
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content);
  }
}

// Fix 1: Logger.warn -> logger.error (most common issue)
const loggerFixes = [
  {
    search: '\\.warn\\(',
    replace: '.error(',
    description: 'Changed logger.warn to logger.error'
  }
];

// Fix 2: Unused parameter fixes
const unusedParamFixes = [
  {
    search: '\\(req, res, next\\)',
    replace: '(_req, res, next)',
    description: 'Mark req parameter as unused'
  },
  {
    search: '\\(req, res\\)',
    replace: '(_req, res)',
    description: 'Mark req parameter as unused'
  },
  {
    search: '\\(error, req, res, next\\)',
    replace: '(error, _req, res, _next)',
    description: 'Mark unused error handler parameters'
  }
];

// Fix 3: Error type assertions
const errorTypeFixes = [
  {
    search: 'error\\)',
    replace: 'error as Error)',
    description: 'Add Error type assertion'
  }
];

// Apply fixes to files
const filesToFix = [
  'src/app.ts',
  'src/controllers/AuthController.ts', 
  'src/middleware/auth.ts',
  'src/middleware/errorHandler.ts',
  'src/middleware/validation.ts',
  'src/repositories/UserRepository.ts',
  'src/services/AuthService.ts',
  'src/database/connection.ts'
];

// Apply logger fixes
filesToFix.forEach(file => {
  fixFile(file, loggerFixes);
});

console.log('✅ TypeScript error fixes applied!');
console.log('💡 You may need to manually fix remaining unused imports and complex type issues.');
console.log('🚀 Try running: npm run build');

console.log('\n📋 Manual fixes you might need:');
console.log('1. Remove unused imports (rateLimitValidation)');
console.log('2. Add type assertions for error handling: (error as Error)');
console.log('3. Fix database query parameter types');
console.log('4. Add underscore prefix to unused parameters: _req, _res, _next');