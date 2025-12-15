const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize the Gemini API client
const initGeminiClient = () => {
  try {
    // Get API key from environment variables
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('GEMINI_API_KEY is not set in environment variables');
      return null;
    }
    
    // Initialize the API
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI;
  } catch (error) {
    console.error('Error initializing Gemini client:', error);
    return null;
  }
};

// Get a Gemini model instance
const getGeminiModel = (modelName = 'gemini-1.5-pro') => {
  try {
    const genAI = initGeminiClient();
    if (!genAI) {
      console.error('Failed to initialize Gemini client');
      return null;
    }
    
    return genAI.getGenerativeModel({ model: modelName });
  } catch (error) {
    console.error('Error getting Gemini model:', error);
    return null;
  }
};

// Generate text with Gemini
exports.generateText = async (prompt, options = {}) => {
  try {
    const model = getGeminiModel(options.model);
    if (!model) {
      console.error('Failed to initialize Gemini model - falling back to default responses');
      return getFallbackResponse(prompt);
    }
    
    const generationConfig = {
      temperature: options.temperature || 0.7,
      topK: options.topK || 40,
      topP: options.topP || 0.95,
      maxOutputTokens: options.maxOutputTokens || 1024,
    };
    
    console.log(`Generating content with model: ${options.model || 'gemini-1.5-pro'}`);
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig,
    });
    
    if (!result || !result.response) {
      console.error('Empty response from Gemini API');
      return getFallbackResponse(prompt);
    }
    
    return result.response.text();
  } catch (error) {
    console.error('Error generating text with Gemini:', error);
    
    // Log more detailed error information
    if (error.message) {
      console.error('Error message:', error.message);
    }
    
    if (error.status) {
      console.error('Error status:', error.status);
    }
    
    // Return a fallback response instead of throwing an error
    return getFallbackResponse(prompt);
  }
};

// Provide fallback responses when the API fails
function getFallbackResponse(prompt) {
  if (prompt.includes('recommendations') || prompt.includes('suggest')) {
    return `
      1. Study core concepts (30 minutes)
      2. Practice with exercises (45 minutes)
      3. Review documentation (20 minutes)
      4. Build a small project (60 minutes)
      5. Watch tutorial videos (30 minutes)
    `;
  } else if (prompt.includes('learning path') || prompt.includes('goal')) {
    return `
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
  } else if (prompt.includes('feedback') || prompt.includes('progress')) {
    return `
      # Progress Assessment
      
      You're making good progress on your learning journey. Keep up the good work!
      
      ## Suggestions for improvement:
      1. Set aside dedicated time each day for learning
      2. Practice regularly to reinforce concepts
      3. Join communities to learn from others
      
      Remember, consistent effort is key to mastering any skill. Keep going!
    `;
  } else {
    return `I couldn't process your request at this time. Please try again later.`;
  }
} 