const express = require('express');
const path = require('path');
const session = require('express-session');
require('dotenv').config();

// Import controllers
const authController = require('./controllers/authController');
const careerPathController = require('./controllers/careerPathController');
const dailyTopicsController = require('./controllers/dailyTopicsController');
const aiController = require('./controllers/aiController');
const mentorController = require('./controllers/mentorController');
const quizController = require('./controllers/quizController');
const quizModel = require('./models/quiz');

// Import Supabase client
const supabase = require('./services/supabase');

const app = express();
const PORT = process.env.PORT || 3000;

// Set up view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'learning-website-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Middleware to check for query parameters and add them to locals
app.use((req, res, next) => {
  res.locals.error = req.query.error || null;
  res.locals.success = req.query.success || null;
  next();
});

// Routes
app.get('/', async (req, res) => {
  try {
    // Check if user is logged in
    const { data: { session } } = await supabase.auth.getSession();
    res.render('index', { user: session?.user || null });
  } catch (err) {
    console.error('Error checking session:', err);
    res.render('index', { user: null });
  }
});

// Authentication routes
app.get('/signup', authController.getSignupPage);
app.post('/signup', authController.signup);
app.get('/login', authController.getLoginPage);
app.post('/login', authController.login);
app.get('/logout', authController.logout);

// Protected routes - require authentication
app.get('/home', authController.isAuthenticated, dailyTopicsController.getDailyTopicsForHome, quizController.getStudentQuizzes, careerPathController.getHomePage);
app.get('/quizzes', authController.isAuthenticated, quizController.getStudentQuizzes, quizController.displayStudentQuizzes);
app.get('/quizzes/:quizId/take', authController.isAuthenticated, quizController.takeQuiz);
app.post('/quizzes/:quizId/submit', authController.isAuthenticated, quizController.submitQuiz);
app.get('/quizzes/:quizId/results', authController.isAuthenticated, quizController.getStudentQuizResults);

// Add singular form routes to match UI links
app.get('/quiz/:quizId', authController.isAuthenticated, quizController.takeQuiz);
app.post('/quiz/:quizId/submit', authController.isAuthenticated, quizController.submitQuiz);
app.get('/quiz/:quizId/results', authController.isAuthenticated, quizController.getStudentQuizResults);

app.post('/update-profile', authController.isAuthenticated, authController.updateProfile);
app.post('/profile/update', authController.isAuthenticated, authController.updateProfile);
app.post('/career-paths', authController.isAuthenticated, careerPathController.createCareerPath);
app.get('/career-paths/:id', authController.isAuthenticated, careerPathController.getCareerPathDetails);
app.post('/career-paths/:id/milestones', authController.isAuthenticated, careerPathController.addMilestone);
app.post('/career-paths/:pathId/milestones/:milestoneId', authController.isAuthenticated, careerPathController.updateMilestoneStatus);
app.post('/career-paths/:id/status', authController.isAuthenticated, careerPathController.updateCareerPathStatus);
app.post('/career-paths/:id/delete', authController.isAuthenticated, careerPathController.deleteCareerPath);

// Daily Topics routes
app.get('/daily-topics', authController.isAuthenticated, dailyTopicsController.getDailyTopics);
app.post('/daily-topics', authController.isAuthenticated, dailyTopicsController.createDailyTopic);
app.post('/daily-topics/:id/status', authController.isAuthenticated, dailyTopicsController.updateDailyTopicStatus);
app.post('/daily-topics/:id/delete', authController.isAuthenticated, dailyTopicsController.deleteDailyTopic);

// AI-powered routes
app.get('/ai-recommendations', authController.isAuthenticated, (req, res) => {
  res.render('aiRecommendations', { user: req.user });
});
app.get('/api/ai/recommendations', authController.isAuthenticated, aiController.generateRecommendations);
app.post('/api/ai/learning-path', authController.isAuthenticated, aiController.generateLearningPath);
app.get('/api/ai/progress-feedback', authController.isAuthenticated, aiController.generateProgressFeedback);

// Mentor routes for students
app.get('/mentors', authController.isAuthenticated, mentorController.listMentors);
app.post('/mentors/:mentorId/request', authController.isAuthenticated, mentorController.requestMentor);

// Mentor authentication routes
app.get('/mentor/login', mentorController.getMentorLoginPage);
app.post('/mentor/login', mentorController.mentorLogin);
app.get('/mentor/logout', mentorController.mentorLogout);

// Protected mentor routes
app.get('/mentor/dashboard', mentorController.isMentorAuthenticated, mentorController.getMentorDashboard);
app.get('/mentor/profile', mentorController.isMentorAuthenticated, mentorController.getMentorProfile);
app.post('/mentor/requests/:requestId/accept', mentorController.isMentorAuthenticated, mentorController.acceptStudentRequest);
app.post('/mentor/requests/:requestId/reject', mentorController.isMentorAuthenticated, mentorController.rejectStudentRequest);
app.get('/mentor/students/:studentId', mentorController.isMentorAuthenticated, mentorController.viewStudentProgress);
app.post('/mentor/students/:studentId/remove', mentorController.isMentorAuthenticated, mentorController.removeStudent);

// Quiz routes for mentors
app.post('/mentor/students/:studentId/assign-quiz', mentorController.isMentorAuthenticated, quizController.assignQuiz);
app.get('/mentor/quizzes', mentorController.isMentorAuthenticated, quizController.getMentorQuizzes);
app.post('/mentor/quizzes/:quizId/delete', mentorController.isMentorAuthenticated, quizController.deleteQuiz);
app.get('/mentor/quizzes/:quizId/results', mentorController.isMentorAuthenticated, quizController.getMentorQuizResults);

// Test route for debugging
app.get('/test-route', (req, res) => {
  res.send('Test route is working!');
});

// Test form route for debugging
app.get('/test-form', (req, res) => {
  res.send(`
    <h1>Test Form</h1>
    <form action="/test-form-submit" method="POST">
      <input type="text" name="testField" placeholder="Test Field" required>
      <button type="submit">Submit</button>
    </form>
  `);
});

app.post('/test-form-submit', (req, res) => {
  console.log('Test form submitted with data:', req.body);
  res.send('Form submitted successfully! Data: ' + JSON.stringify(req.body));
});

// Test quiz assignment route
app.get('/test-quiz-assign/:studentId', mentorController.isMentorAuthenticated, (req, res) => {
  const { studentId } = req.params;
  res.send(`
    <h1>Test Quiz Assignment</h1>
    <form action="/mentor/students/${studentId}/assign-quiz" method="POST">
      <input type="hidden" name="studentId" value="${studentId}">
      <input type="text" name="topicId" placeholder="Topic ID" value="test-topic-id" required>
      <input type="text" name="topicType" placeholder="Topic Type" value="test_topic" required>
      <input type="text" name="topicName" placeholder="Topic Name" value="Test Topic" required>
      <button type="submit">Assign Quiz</button>
    </form>
  `);
});

// Simple HTML form for testing quiz assignment
app.get('/test-quiz-form/:studentId', (req, res) => {
  const { studentId } = req.params;
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Test Quiz Assignment</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .form-container { max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input[type="text"] { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        button { padding: 10px 15px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; }
        .error { color: red; margin-top: 10px; }
        .success { color: green; margin-top: 10px; }
      </style>
    </head>
    <body>
      <div class="form-container">
        <h1>Test Quiz Assignment</h1>
        <p>This form will directly submit to the quiz assignment endpoint.</p>
        
        <form id="quizForm">
          <div class="form-group">
            <label for="studentId">Student ID:</label>
            <input type="text" id="studentId" name="studentId" value="${studentId}" readonly>
          </div>
          
          <div class="form-group">
            <label for="topicId">Topic ID:</label>
            <input type="text" id="topicId" name="topicId" value="test-topic-id" required>
          </div>
          
          <div class="form-group">
            <label for="topicType">Topic Type:</label>
            <input type="text" id="topicType" name="topicType" value="test_topic" required>
          </div>
          
          <div class="form-group">
            <label for="topicName">Topic Name:</label>
            <input type="text" id="topicName" name="topicName" value="Test Topic" required>
          </div>
          
          <button type="submit">Assign Quiz</button>
        </form>
        
        <div id="result"></div>
      </div>
      
      <script>
        document.getElementById('quizForm').addEventListener('submit', function(e) {
          e.preventDefault();
          
          const studentId = document.getElementById('studentId').value;
          const topicId = document.getElementById('topicId').value;
          const topicType = document.getElementById('topicType').value;
          const topicName = document.getElementById('topicName').value;
          
          // First try the API endpoint
          fetch('/api/assign-quiz', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              studentId,
              topicId,
              topicType,
              topicName
            })
          })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              document.getElementById('result').innerHTML = '<div class="success">Quiz assigned successfully via API! Quiz ID: ' + data.quizId + '</div>';
            } else {
              document.getElementById('result').innerHTML = '<div class="error">API Error: ' + data.error + '</div>';
              
              // If API fails, try the direct route
              submitDirectRoute();
            }
          })
          .catch(error => {
            console.error('Error:', error);
            document.getElementById('result').innerHTML = '<div class="error">API Error: ' + error.message + '</div>';
            
            // If API fails, try the direct route
            submitDirectRoute();
          });
          
          function submitDirectRoute() {
            // Create a form and submit it directly
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = '/mentor/students/' + studentId + '/assign-quiz';
            
            const fields = {
              studentId,
              topicId,
              topicType,
              topicName
            };
            
            for (const key in fields) {
              const input = document.createElement('input');
              input.type = 'hidden';
              input.name = key;
              input.value = fields[key];
              form.appendChild(input);
            }
            
            document.body.appendChild(form);
            form.submit();
          }
        });
      </script>
    </body>
    </html>
  `);
});

// Direct API endpoint for quiz assignment (for testing)
app.post('/api/assign-quiz', mentorController.isMentorAuthenticated, async (req, res) => {
  try {
    const mentorId = req.session.mentor.id;
    const { studentId, topicId, topicType, topicName } = req.body;
    
    console.log('API: Assigning quiz with data:', { mentorId, studentId, topicId, topicType, topicName });
    
    if (!studentId || !topicId || !topicType || !topicName) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        received: { studentId, topicId, topicType, topicName }
      });
    }
    
    // Generate quiz questions
    console.log(`API: Generating quiz questions for topic: ${topicName}`);
    const questions = await quizController.generateQuizQuestions(topicName, topicType);
    console.log(`API: Generated ${questions ? questions.length : 0} questions`);
    
    if (!questions || questions.length === 0) {
      return res.status(500).json({ error: 'Failed to generate quiz questions' });
    }
    
    // Create the quiz
    const quizData = {
      mentor_id: mentorId,
      student_id: studentId,
      topic_id: topicId,
      topic_type: topicType,
      topic_name: topicName,
      questions: questions
    };
    
    console.log('API: Creating quiz with data:', JSON.stringify({
      mentor_id: mentorId,
      student_id: studentId,
      topic_id: topicId,
      topic_type: topicType,
      topic_name: topicName,
      questions_count: questions.length
    }, null, 2));
    
    const quiz = await quizModel.createQuiz(quizData);
    
    if (!quiz) {
      return res.status(500).json({ error: 'Failed to create quiz' });
    }
    
    console.log('API: Quiz created successfully with ID:', quiz.id);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Quiz assigned successfully',
      quizId: quiz.id
    });
  } catch (err) {
    console.error('API Error assigning quiz:', err);
    return res.status(500).json({ 
      error: 'An error occurred while assigning the quiz',
      message: err.message
    });
  }
});

// Handle 404
app.use((req, res) => {
  console.error(`404 Not Found: ${req.method} ${req.url}`);
  console.error('Request body:', req.body);
  console.error('Request params:', req.params);
  console.error('Request query:', req.query);
  
  res.status(404).render('404', { 
    title: 'Page Not Found',
    user: req.user || null,
    requestedUrl: req.url
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Application error:', err);
  
  // Check for Supabase connection errors
  if (err.message && (
    err.message.includes('fetch failed') || 
    err.message.includes('network error') || 
    err.message.includes('connection')
  )) {
    // This is likely a Supabase connection issue
    console.error('Supabase connection error detected');
    
    // If this is an API request, return JSON
    if (req.xhr || (req.headers.accept && req.headers.accept.includes('json'))) {
      return res.status(503).json({
        error: 'Database connection issue',
        message: 'We are experiencing temporary database connection issues. Please try again in a few moments.'
      });
    }
    
    // For regular requests, render the error page
    return res.status(503).render('error', {
      title: 'Database Connection Issue',
      error: {
        message: 'We are experiencing temporary database connection issues. Please try again in a few moments.',
        status: 503
      },
      user: req.user || null
    });
  }
  
  // For other errors, use default error handling
  const statusCode = err.status || 500;
  
  // If this is an API request, return JSON
  if (req.xhr || (req.headers.accept && req.headers.accept.includes('json'))) {
    return res.status(statusCode).json({
      error: err.message || 'Internal Server Error',
      status: statusCode
    });
  }
  
  // For regular requests, render the error page
  res.status(statusCode).render('error', {
    title: err.message || 'Error',
    error: err,
    user: req.user || null
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
}); 