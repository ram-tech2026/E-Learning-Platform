const quizModel = require('../models/quiz');
const careerPathModel = require('../models/careerPath');
const dailyTopicsModel = require('../models/dailyTopics');
const geminiService = require('../services/gemini');
const mentorModel = require('../models/mentor');

// Generate quiz questions using Gemini API
exports.generateQuizQuestions = async (topic, topicType) => {
  try {
    let prompt = `Generate a quiz with 5 multiple-choice questions about "${topic}". 
    Each question should have 4 options (A, B, C, D) with only one correct answer.
    Format the response as a JSON array with the following structure for each question:
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "B", // The letter of the correct option
      "explanation": "Brief explanation of why this is the correct answer"
    }
    Make sure the questions cover different aspects of the topic and vary in difficulty.`;

    const rawResponse = await geminiService.generateText(prompt, {
      temperature: 0.7,
      maxOutputTokens: 1024
    });

    // Extract the JSON part from the response
    let jsonStr = rawResponse;
    if (rawResponse.includes('[') && rawResponse.includes(']')) {
      jsonStr = rawResponse.substring(
        rawResponse.indexOf('['),
        rawResponse.lastIndexOf(']') + 1
      );
    }

    // Parse the JSON
    let questions;
    try {
      questions = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Error parsing quiz questions JSON:', parseError);
      // Fallback to default questions if parsing fails
      questions = getDefaultQuestions(topic);
    }

    return questions;
  } catch (error) {
    console.error('Error generating quiz questions:', error);
    return getDefaultQuestions(topic);
  }
};

// Fallback questions if API fails
const getDefaultQuestions = (topic) => {
  return [
    {
      question: `What is the most fundamental concept in ${topic}?`,
      options: ["Basic principles", "Advanced techniques", "Historical context", "Future developments"],
      correctAnswer: "A",
      explanation: "Understanding the basic principles is essential before moving to more complex aspects."
    },
    {
      question: `Which of the following best describes ${topic}?`,
      options: ["A theoretical framework", "A practical methodology", "A historical movement", "A future trend"],
      correctAnswer: "B",
      explanation: "It is primarily known as a practical methodology that can be applied in various contexts."
    },
    {
      question: `When was ${topic} first introduced?`,
      options: ["1950s", "1970s", "1990s", "2010s"],
      correctAnswer: "B",
      explanation: "The concept was first formally introduced in the 1970s, though some principles existed earlier."
    },
    {
      question: `Which field is most closely related to ${topic}?`,
      options: ["Computer Science", "Psychology", "Economics", "Biology"],
      correctAnswer: "A",
      explanation: "Computer Science has the most direct applications and connections to this topic."
    },
    {
      question: `What is a common application of ${topic}?`,
      options: ["Data analysis", "Creative writing", "Physical exercise", "Cooking"],
      correctAnswer: "A",
      explanation: "Data analysis is one of the most common practical applications of this topic."
    }
  ];
};

// Assign a quiz to a student
exports.assignQuiz = async (req, res) => {
  try {
    // Check if mentor is authenticated
    if (!req.session || !req.session.mentor || !req.session.mentor.id) {
      console.error('Mentor not authenticated');
      return res.status(401).send('Authentication required. Please log in as a mentor.');
    }

    const mentorId = req.session.mentor.id;
    const { studentId, topicId, topicType, topicName } = req.body;
    
    console.log('Assigning quiz with data:', { mentorId, studentId, topicId, topicType, topicName });
    
    if (!studentId || !topicId || !topicType || !topicName) {
      console.error('Missing required fields for quiz assignment:', { studentId, topicId, topicType, topicName });
      return res.redirect(`/mentor/students/${studentId}?error=Missing required fields for quiz assignment`);
    }
    
    // Generate quiz questions
    console.log(`Generating quiz questions for topic: ${topicName}`);
    const questions = await exports.generateQuizQuestions(topicName, topicType);
    console.log(`Generated ${questions.length} questions`);
    
    // Create the quiz
    const quizData = {
      mentor_id: mentorId,
      student_id: studentId,
      topic_id: topicId,
      topic_type: topicType,
      topic_name: topicName,
      questions: questions
    };
    
    console.log('Creating quiz with data:', JSON.stringify(quizData, null, 2));
    
    try {
      const quiz = await quizModel.createQuiz(quizData);
      
      if (!quiz) {
        console.error('Failed to create quiz - returned null');
        return res.redirect(`/mentor/students/${studentId}?error=Failed to create quiz`);
      }
      
      console.log('Quiz created successfully:', quiz.id);
      return res.redirect(`/mentor/students/${studentId}?success=Quiz assigned successfully`);
    } catch (createError) {
      console.error('Error creating quiz:', createError);
      return res.redirect(`/mentor/students/${studentId}?error=Error creating quiz: ${createError.message}`);
    }
  } catch (err) {
    console.error('Error assigning quiz:', err);
    // If we can't get studentId from req.body, try to get it from req.params
    const studentId = req.body.studentId || req.params.studentId || 'unknown';
    return res.redirect(`/mentor/students/${studentId}?error=An error occurred while assigning the quiz: ${err.message}`);
  }
};

// Get quiz for student to take
exports.getQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const userId = req.user.id;
    
    // Get the quiz
    const quiz = await quizModel.getQuizById(quizId);
    
    if (!quiz) {
      return res.redirect('/home?error=Quiz not found');
    }
    
    // Check if this quiz belongs to the current user
    if (quiz.student_id !== userId) {
      return res.redirect('/home?error=You do not have permission to access this quiz');
    }
    
    // Check if quiz is already completed
    if (quiz.status === 'completed') {
      return res.redirect(`/quiz/${quizId}/results`);
    }
    
    // Parse the questions from the quiz
    let questions = [];
    try {
      // Check if questions is a string and needs to be parsed
      if (quiz.questions && typeof quiz.questions === 'string') {
        questions = JSON.parse(quiz.questions);
      } else if (quiz.questions) {
        // If it's already an object (Supabase might return JSONB as parsed)
        questions = quiz.questions;
      }
      
      console.log(`Parsed ${questions.length} questions for quiz ${quizId}`);
    } catch (parseError) {
      console.error('Error parsing quiz questions:', parseError);
      return res.redirect(`/home?error=Failed to parse quiz questions: ${parseError.message}`);
    }
    
    // Render the quiz page
    res.render('takeQuiz', {
      user: req.user,
      quiz: quiz,
      questions: questions,
      error: req.query.error || null,
      success: req.query.success || null
    });
  } catch (err) {
    console.error('Error getting quiz:', err);
    return res.redirect('/home?error=Failed to load quiz');
  }
};

// Submit completed quiz
exports.submitQuiz = async (req, res) => {
  try {
    const userId = req.user.id;
    const quizId = req.params.quizId;
    const userAnswers = req.body.answers;
    
    console.log('Submitted answers:', userAnswers);
    
    // Get quiz details
    const quiz = await quizModel.getQuizById(quizId);
    
    if (!quiz) {
      return res.redirect('/quizzes?error=Quiz not found');
    }
    
    // Check if quiz is assigned to this student
    if (quiz.student_id !== userId) {
      return res.redirect('/quizzes?error=You do not have permission to submit this quiz');
    }
    
    // Check if quiz is already completed
    if (quiz.status === 'completed') {
      return res.redirect(`/quizzes/${quizId}/results?error=You have already completed this quiz`);
    }
    
    // Parse the questions from the quiz
    let questions = [];
    try {
      // Check if questions is a string and needs to be parsed
      if (quiz.questions && typeof quiz.questions === 'string') {
        questions = JSON.parse(quiz.questions);
      } else if (quiz.questions) {
        // If it's already an object (Supabase might return JSONB as parsed)
        questions = quiz.questions;
      }
      
      console.log(`Processing ${questions.length} questions for quiz ${quizId}`);
    } catch (parseError) {
      console.error('Error parsing quiz questions:', parseError);
      return res.redirect(`/quizzes/${quizId}?error=Failed to parse quiz questions: ${parseError.message}`);
    }
    
    // Calculate score and prepare answers for storage
    let correctCount = 0;
    const answers = [];
    const strengths = [];
    const weaknesses = [];
    
    questions.forEach((question, index) => {
      const userAnswer = userAnswers[index];
      const correctAnswer = question.correctAnswer;
      const isCorrect = userAnswer === correctAnswer;
      
      console.log(`Question ${index}: User answered ${userAnswer}, correct is ${correctAnswer}, isCorrect: ${isCorrect}`);
      
      if (isCorrect) {
        correctCount++;
        // Add to strengths if not already there
        const topic = question.question.split(' ').slice(0, 3).join(' ');
        if (!strengths.includes(topic)) {
          strengths.push(topic);
        }
      } else {
        // Add to weaknesses if not already there
        const topic = question.question.split(' ').slice(0, 3).join(' ');
        if (!weaknesses.includes(topic)) {
          weaknesses.push(topic);
        }
      }
      
      answers.push({
        question: question.question,
        user_answer: userAnswer,
        correct_answer: correctAnswer,
        is_correct: isCorrect,
        explanation: question.explanation || 'No explanation provided'
      });
    });
    
    const score = (correctCount / questions.length) * 100;
    
    // Update quiz as completed
    const updatedQuiz = await quizModel.completeQuiz(quizId, {
      score: score,
      answers: JSON.stringify(answers),
      strengths,
      weaknesses,
      completed_at: new Date()
    });
    
    if (!updatedQuiz) {
      return res.redirect('/quizzes?error=Failed to submit quiz');
    }
    
    return res.redirect(`/quizzes/${quizId}/results?success=Quiz completed successfully`);
  } catch (err) {
    console.error('Error submitting quiz:', err);
    return res.redirect('/quizzes?error=Failed to submit quiz');
  }
};

// View quiz results
exports.getQuizResults = async (req, res) => {
  try {
    const { quizId } = req.params;
    const userId = req.user.id;
    
    // Get the quiz
    const quiz = await quizModel.getQuizById(quizId);
    
    if (!quiz) {
      return res.redirect('/home?error=Quiz not found');
    }
    
    // Check if this quiz belongs to the current user
    if (quiz.student_id !== userId) {
      return res.redirect('/home?error=You do not have permission to access this quiz');
    }
    
    // Check if quiz is completed
    if (quiz.status !== 'completed') {
      return res.redirect(`/quiz/${quizId}?error=Quiz not yet completed`);
    }
    
    // Render the results page
    res.render('quizResults', {
      user: req.user,
      quiz: quiz,
      error: req.query.error || null,
      success: req.query.success || null
    });
  } catch (err) {
    console.error('Error getting quiz results:', err);
    return res.redirect('/home?error=Failed to load quiz results');
  }
};

// Get student's quizzes for display on home page
exports.getStudentQuizzes = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Get quizzes for this student
    const quizzes = await quizModel.getQuizzesByStudentId(userId);
    
    // Add quizzes to request object for use in next middleware
    req.quizzes = quizzes || [];
    
    // Log for debugging
    console.log(`Retrieved ${req.quizzes.length} quizzes for student ${userId}`);
    
    next();
  } catch (err) {
    console.error('Error getting student quizzes:', err);
    req.quizzes = [];
    next();
  }
};

// Get mentor's assigned quizzes
exports.getMentorQuizzes = async (req, res) => {
  try {
    const mentorId = req.session.mentor.id;
    
    // Get quizzes assigned by this mentor
    const quizzes = await quizModel.getQuizzesByMentorId(mentorId);
    
    // Get student profiles for each quiz
    const quizzesWithStudentInfo = await Promise.all(quizzes.map(async (quiz) => {
      const studentProfile = await careerPathModel.getProfileByUserId(quiz.student_id);
      return {
        ...quiz,
        studentName: studentProfile ? studentProfile.username : 'Unknown Student',
        studentEmail: studentProfile ? studentProfile.email : 'No email'
      };
    }));
    
    return res.render('mentorQuizzes', {
      mentor: req.session.mentor,
      quizzes: quizzesWithStudentInfo,
      error: req.query.error || null,
      success: req.query.success || null
    });
  } catch (err) {
    console.error('Error getting mentor quizzes:', err);
    return res.redirect('/mentor/dashboard?error=Failed to load quizzes');
  }
};

// Delete a quiz
exports.deleteQuiz = async (req, res) => {
  try {
    const mentorId = req.session.mentor.id;
    const { quizId } = req.params;
    
    // Get the quiz
    const quiz = await quizModel.getQuizById(quizId);
    
    if (!quiz) {
      return res.redirect('/mentor/quizzes?error=Quiz not found');
    }
    
    // Check if this quiz belongs to this mentor
    if (quiz.mentor_id !== mentorId) {
      return res.redirect('/mentor/quizzes?error=You do not have permission to delete this quiz');
    }
    
    // Delete the quiz
    const deleted = await quizModel.deleteQuiz(quizId);
    
    if (!deleted) {
      return res.redirect('/mentor/quizzes?error=Failed to delete quiz');
    }
    
    return res.redirect('/mentor/quizzes?success=Quiz deleted successfully');
  } catch (err) {
    console.error('Error deleting quiz:', err);
    return res.redirect('/mentor/quizzes?error=An error occurred while deleting the quiz');
  }
};

// Get quiz results for mentor
exports.getMentorQuizResults = async (req, res) => {
  try {
    const mentorId = req.session.mentor.id;
    const { quizId } = req.params;
    
    // Get the quiz
    const quiz = await quizModel.getQuizById(quizId);
    
    if (!quiz) {
      return res.redirect('/mentor/quizzes?error=Quiz not found');
    }
    
    // Handle static mentor IDs (convert string like "1" to a proper UUID)
    let formattedMentorId = mentorId;
    if (mentorId && !mentorId.includes('-')) {
      // This is a static mentor ID, convert it to a UUID format
      formattedMentorId = `00000000-0000-4000-a000-00000000000${mentorId}`;
      console.log(`Converting static mentor ID "${mentorId}" to UUID format: ${formattedMentorId}`);
    }
    
    // Check if this quiz belongs to this mentor
    if (quiz.mentor_id !== formattedMentorId) {
      console.log(`Quiz mentor ID ${quiz.mentor_id} does not match mentor ID ${formattedMentorId}`);
      return res.redirect('/mentor/quizzes?error=You do not have permission to view this quiz');
    }
    
    // Check if quiz is completed
    if (quiz.status !== 'completed') {
      return res.redirect('/mentor/quizzes?error=Quiz not yet completed by student');
    }
    
    // Parse the answers, strengths, and weaknesses
    let answers = [];
    let strengths = [];
    let weaknesses = [];
    
    try {
      answers = typeof quiz.answers === 'string' ? JSON.parse(quiz.answers) : quiz.answers || [];
      strengths = typeof quiz.strengths === 'string' ? JSON.parse(quiz.strengths) : quiz.strengths || [];
      weaknesses = typeof quiz.weaknesses === 'string' ? JSON.parse(quiz.weaknesses) : quiz.weaknesses || [];
      
      console.log('Parsed quiz results for mentor view:', { 
        answersCount: answers.length, 
        strengths, 
        weaknesses 
      });
    } catch (parseError) {
      console.error('Error parsing quiz results:', parseError);
    }
    
    // Get student profile
    const studentProfile = await careerPathModel.getProfileByUserId(quiz.student_id);
    
    // Render the results page
    res.render('mentorQuizResults', {
      mentor: req.session.mentor,
      quiz: {
        ...quiz,
        answers: answers,
        strengths: strengths,
        weaknesses: weaknesses
      },
      student: {
        id: quiz.student_id,
        name: studentProfile ? studentProfile.username : 'Unknown Student',
        email: studentProfile ? studentProfile.email : 'No email'
      },
      error: req.query.error || null,
      success: req.query.success || null
    });
  } catch (err) {
    console.error('Error getting quiz results for mentor:', err);
    return res.redirect('/mentor/quizzes?error=Failed to load quiz results');
  }
};

// Display all quizzes for a student
exports.displayStudentQuizzes = async (req, res) => {
  try {
    // Quizzes are already loaded by getStudentQuizzes middleware
    const quizzes = req.quizzes || [];
    
    return res.render('studentQuizzes', {
      user: req.user,
      quizzes: quizzes,
      error: req.query.error || null,
      success: req.query.success || null
    });
  } catch (err) {
    console.error('Error displaying student quizzes:', err);
    return res.redirect('/home?error=Failed to load quizzes');
  }
};

// Display quiz for student to take
exports.takeQuiz = async (req, res) => {
  try {
    const userId = req.user.id;
    const quizId = req.params.quizId;
    
    // Get quiz details
    const quiz = await quizModel.getQuizById(quizId);
    
    if (!quiz) {
      return res.redirect('/quizzes?error=Quiz not found');
    }
    
    // Check if quiz is assigned to this student
    if (quiz.student_id !== userId) {
      return res.redirect('/quizzes?error=You do not have permission to take this quiz');
    }
    
    // Check if quiz is already completed
    if (quiz.status === 'completed') {
      return res.redirect(`/quizzes/${quizId}/results?error=You have already completed this quiz`);
    }
    
    // Parse the questions from the quiz
    let questions = [];
    try {
      // Check if questions is a string and needs to be parsed
      if (quiz.questions && typeof quiz.questions === 'string') {
        questions = JSON.parse(quiz.questions);
      } else if (quiz.questions) {
        // If it's already an object (Supabase might return JSONB as parsed)
        questions = quiz.questions;
      }
      
      console.log(`Parsed ${questions.length} questions for quiz ${quizId}`);
    } catch (parseError) {
      console.error('Error parsing quiz questions:', parseError);
      return res.redirect(`/quizzes?error=Failed to parse quiz questions: ${parseError.message}`);
    }
    
    return res.render('takeQuiz', {
      user: req.user,
      quiz: quiz,
      questions: questions,
      error: req.query.error || null,
      success: req.query.success || null
    });
  } catch (err) {
    console.error('Error displaying quiz to take:', err);
    return res.redirect('/quizzes?error=Failed to load quiz');
  }
};

// Display quiz results for student
exports.getStudentQuizResults = async (req, res) => {
  try {
    const userId = req.user.id;
    const quizId = req.params.quizId;
    
    // Get quiz details
    const quiz = await quizModel.getQuizById(quizId);
    
    if (!quiz) {
      return res.redirect('/quizzes?error=Quiz not found');
    }
    
    // Check if quiz is assigned to this student
    if (quiz.student_id !== userId) {
      return res.redirect('/quizzes?error=You do not have permission to view this quiz');
    }
    
    // Check if quiz is completed
    if (quiz.status !== 'completed') {
      return res.redirect(`/quizzes/${quizId}/take?error=You need to complete this quiz first`);
    }
    
    // Parse the answers, strengths, and weaknesses
    let answers = [];
    let strengths = [];
    let weaknesses = [];
    
    try {
      answers = typeof quiz.answers === 'string' ? JSON.parse(quiz.answers) : quiz.answers || [];
      strengths = typeof quiz.strengths === 'string' ? JSON.parse(quiz.strengths) : quiz.strengths || [];
      weaknesses = typeof quiz.weaknesses === 'string' ? JSON.parse(quiz.weaknesses) : quiz.weaknesses || [];
      
      console.log('Parsed quiz results:', { 
        answersCount: answers.length, 
        strengths, 
        weaknesses 
      });
    } catch (parseError) {
      console.error('Error parsing quiz results:', parseError);
    }
    
    // Get mentor info if available
    let mentor = { name: 'Unknown Mentor' };
    try {
      if (quiz.mentor_id) {
        const mentorData = await mentorModel.getMentorById(quiz.mentor_id);
        if (mentorData) {
          mentor = mentorData;
        }
      }
    } catch (mentorError) {
      console.error('Error getting mentor info:', mentorError);
    }
    
    return res.render('studentQuizResults', {
      user: req.user,
      quiz: {
        ...quiz,
        answers: answers,
        strengths: strengths,
        weaknesses: weaknesses
      },
      mentor: mentor,
      error: req.query.error || null,
      success: req.query.success || null
    });
  } catch (err) {
    console.error('Error displaying quiz results:', err);
    return res.redirect('/quizzes?error=Failed to load quiz results');
  }
};

// Helper function to shuffle array
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
} 