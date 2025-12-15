// Re-export everything from mentors.js
// This file exists to fix the import path in quizController.js

const mentorsModel = require('./mentors');

// Export all methods from mentors.js
module.exports = mentorsModel; 