const geminiService = require('../services/gemini');
const dailyTopicsModel = require('../models/dailyTopics');
const careerPathModel = require('../models/careerPath');

// Generate learning recommendations
exports.generateRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    let learningGoals = '';
    
    try {
      // Get user's career paths
      const careerPaths = await careerPathModel.getCareerPathsByUserId(userId);
      
      // Extract learning goals from career paths
      learningGoals = careerPaths.map(path => path.learning_goal).join(', ');
      
      // If no learning goals, provide a default
      if (!learningGoals) {
        learningGoals = 'general learning and skill improvement';
      }
    } catch (pathsErr) {
      console.error('Error getting career paths for recommendations:', pathsErr);
      learningGoals = 'general learning and skill improvement';
    }
    
    console.log('Generating recommendations for learning goals:', learningGoals);
    
    // Generate recommendations using Gemini API
    const recommendations = await geminiService.generateText(
      `Based on these learning goals: "${learningGoals}", suggest 5 specific daily topics that would help the user progress. For each topic, provide a title and estimated time in minutes (between 15-60).`,
      { model: 'gemini-1.5-pro' }
    );
    
    // Return recommendations
    res.json({ 
      success: true, 
      recommendations 
    });
    
  } catch (err) {
    console.error('Error generating recommendations:', err);
    // Return fallback recommendations
    const fallbackRecommendations = `
      1. Study core concepts (30 minutes)
      2. Practice with exercises (45 minutes)
      3. Review documentation (20 minutes)
      4. Build a small project (60 minutes)
      5. Watch tutorial videos (30 minutes)
    `;
    
    res.json({ 
      success: true, 
      recommendations: fallbackRecommendations
    });
  }
};

// Generate a learning path based on a goal
exports.generateLearningPath = async (req, res) => {
  try {
    const { learningGoal } = req.body;
    
    if (!learningGoal) {
      return res.status(400).json({ 
        success: false, 
        error: 'Learning goal is required' 
      });
    }
    
    console.log('Generating learning path for goal:', learningGoal);
    
    // Generate learning path using Gemini API
    const prompt = `
      Create a structured learning path for the following goal:
      
      Learning goal: ${learningGoal}
      
      Please provide:
      1. 5 key milestones to achieve this goal
      2. For each milestone, suggest a specific resource or activity
      3. Arrange them in a logical progression from beginner to advanced
    `;
    
    const generatedPath = await geminiService.generateText(prompt, { model: 'gemini-1.5-pro' });
    
    // Return the generated learning path
    res.json({ 
      success: true, 
      learningPath: generatedPath 
    });
    
  } catch (err) {
    console.error('Error generating learning path:', err);
    
    // Return fallback learning path
    const fallbackPath = `
      # Learning Path
      
      ## Milestone 1: Understand the basics
      Start with fundamental concepts and build a strong foundation.
      
      ## Milestone 2: Practice with exercises
      Apply what you've learned through practical exercises.
      
      ## Milestone 3: Build a small project
      Create a simple project to demonstrate your skills.
      
      ## Milestone 4: Learn advanced concepts
      Dive deeper into more complex topics.
      
      ## Milestone 5: Complete a capstone project
      Build a comprehensive project that showcases all your skills.
    `;
    
    res.json({ 
      success: true, 
      learningPath: fallbackPath
    });
  }
};

// Generate feedback on user progress
exports.generateProgressFeedback = async (req, res) => {
  try {
    const userId = req.user.id;
    let learningGoals = '';
    let completedTopics = [];
    let inProgressTopics = [];
    
    try {
      // Get user's career paths
      const careerPaths = await careerPathModel.getCareerPathsByUserId(userId);
      
      // Extract learning goals
      learningGoals = careerPaths.map(path => path.learning_goal).join(', ');
      
      if (!learningGoals) {
        learningGoals = 'general learning and skill improvement';
      }
    } catch (pathsErr) {
      console.error('Error getting career paths for feedback:', pathsErr);
      learningGoals = 'general learning and skill improvement';
    }
    
    try {
      // Get user's daily topics
      const dailyTopics = await dailyTopicsModel.getDailyTopicsByUserId(userId);
      
      // Extract completed and in-progress topics
      completedTopics = dailyTopics
        .filter(topic => topic.status === 'completed')
        .map(topic => topic.title);
        
      inProgressTopics = dailyTopics
        .filter(topic => topic.status === 'in_progress' || topic.status === 'pending')
        .map(topic => topic.title);
    } catch (topicsErr) {
      console.error('Error getting daily topics for feedback:', topicsErr);
      // Leave as empty arrays
    }
    
    console.log('Generating progress feedback for user:', userId);
    
    // Generate feedback using Gemini API
    const prompt = `
      Based on the following information about a learner's progress, provide constructive feedback and suggestions:
      
      Learning goals: ${learningGoals}
      
      Completed topics:
      ${completedTopics.length > 0 ? completedTopics.join('\n') : 'No completed topics yet'}
      
      In-progress topics:
      ${inProgressTopics.length > 0 ? inProgressTopics.join('\n') : 'No in-progress topics yet'}
      
      Please provide:
      1. An assessment of their progress
      2. 2-3 specific suggestions to improve or accelerate learning
      3. A motivational message to keep them engaged
    `;
    
    const feedback = await geminiService.generateText(prompt, { model: 'gemini-1.5-pro' });
    
    // Return the feedback
    res.json({ 
      success: true, 
      feedback 
    });
    
  } catch (err) {
    console.error('Error generating progress feedback:', err);
    
    // Return fallback feedback
    const fallbackFeedback = `
      # Progress Assessment
      
      You're making good progress on your learning journey. Keep up the good work!
      
      ## Suggestions for improvement:
      1. Set aside dedicated time each day for learning
      2. Practice regularly to reinforce concepts
      3. Join communities to learn from others
      
      Remember, consistent effort is key to mastering any skill. Keep going!
    `;
    
    res.json({ 
      success: true, 
      feedback: fallbackFeedback
    });
  }
}; 