const mentorModel = require('../models/mentors');
const careerPathModel = require('../models/careerPath');
const dailyTopicsModel = require('../models/dailyTopics');

// Render mentor login page
exports.getMentorLoginPage = (req, res) => {
  res.render('mentorLogin', { error: null });
};

// Handle mentor login
exports.mentorLogin = (req, res) => {
  const { email, password } = req.body;
  
  // Basic validation
  if (!email || !password) {
    return res.render('mentorLogin', { 
      error: 'Email and password are required' 
    });
  }
  
  // Check if mentor exists with given email
  const mentor = mentorModel.getMentorByEmail(email);
  
  if (!mentor) {
    return res.render('mentorLogin', { 
      error: 'Mentor not found with this email' 
    });
  }
  
  // Check password (in a real app, this would use proper hashing)
  if (mentor.password !== password) {
    return res.render('mentorLogin', { 
      error: 'Invalid password' 
    });
  }
  
  // Set mentor session
  req.session = req.session || {};
  req.session.mentor = {
    id: mentor.id,
    name: mentor.name,
    email: mentor.email,
    expertise: mentor.expertise
  };
  
  // Redirect to mentor dashboard
  return res.redirect('/mentor/dashboard');
};

// Mentor logout
exports.mentorLogout = (req, res) => {
  if (req.session) {
    req.session.mentor = null;
  }
  
  return res.redirect('/mentor/login');
};

// Check if mentor is authenticated
exports.isMentorAuthenticated = (req, res, next) => {
  if (!req.session || !req.session.mentor) {
    return res.redirect('/mentor/login');
  }
  
  next();
};

// Render mentor dashboard
exports.getMentorDashboard = async (req, res) => {
  try {
    const mentorId = req.session.mentor.id;
    
    // Get pending requests
    const pendingRequests = await mentorModel.getMentorRequests(mentorId);
    
    // Get current students
    const students = await mentorModel.getMentorStudents(mentorId);
    
    res.render('mentorDashboard', {
      mentor: req.session.mentor,
      pendingRequests,
      students,
      error: req.query.error || null,
      success: req.query.success || null
    });
  } catch (err) {
    console.error('Error getting mentor dashboard data:', err);
    res.render('mentorDashboard', {
      mentor: req.session.mentor,
      pendingRequests: [],
      students: [],
      error: 'Failed to load dashboard data',
      success: null
    });
  }
};

// Accept a student request
exports.acceptStudentRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    const result = mentorModel.acceptMentorRequest(requestId);
    
    if (!result.success) {
      return res.redirect(`/mentor/dashboard?error=${encodeURIComponent(result.message)}`);
    }
    
    return res.redirect(`/mentor/dashboard?success=${encodeURIComponent(result.message)}`);
  } catch (err) {
    console.error('Error accepting student request:', err);
    return res.redirect('/mentor/dashboard?error=Failed to accept request');
  }
};

// Reject a student request
exports.rejectStudentRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    const result = mentorModel.rejectMentorRequest(requestId);
    
    if (!result.success) {
      return res.redirect(`/mentor/dashboard?error=${encodeURIComponent(result.message)}`);
    }
    
    return res.redirect(`/mentor/dashboard?success=${encodeURIComponent('Request rejected')}`);
  } catch (err) {
    console.error('Error rejecting student request:', err);
    return res.redirect('/mentor/dashboard?error=Failed to reject request');
  }
};

// View student progress
exports.viewStudentProgress = async (req, res) => {
  try {
    const mentorId = req.session.mentor.id;
    const { studentId } = req.params;
    
    console.log(`Mentor ${mentorId} viewing progress for student ${studentId}`);
    
    // Check if this student is assigned to this mentor
    const isStudentAssigned = await mentorModel.isStudentAssignedToMentor(mentorId, studentId);
    
    if (!isStudentAssigned) {
      console.log(`Student ${studentId} is not assigned to mentor ${mentorId}`);
      return res.redirect('/mentor/dashboard?error=Student not assigned to you');
    }
    
    // Get student profile
    const studentProfile = await careerPathModel.getProfileByUserId(studentId);
    
    if (!studentProfile) {
      console.log(`Student profile not found for ${studentId}`);
      return res.redirect('/mentor/dashboard?error=Student profile not found');
    }
    
    // Get student's career paths with milestones
    const careerPaths = await Promise.all((await careerPathModel.getCareerPathsByUserId(studentId)).map(async (path) => {
      const milestones = await careerPathModel.getMilestonesByCareerPathId(path.id);
      return { ...path, milestones };
    }));
    
    // Get student's daily topics
    const dailyTopics = await dailyTopicsModel.getDailyTopicsByUserId(studentId);
    
    // Get student's quizzes
    const quizModel = require('../models/quiz');
    let quizzes = [];
    try {
      quizzes = await quizModel.getQuizzesByStudentId(studentId);
      console.log(`Retrieved ${quizzes.length} quizzes for student ${studentId} in mentor view`);
    } catch (quizError) {
      console.error('Error retrieving quizzes for student:', quizError);
      quizzes = [];
    }
    
    res.render('studentProgress', {
      mentor: req.session.mentor,
      student: {
        id: studentId,
        name: studentProfile.username || 'Unknown Student',
        email: studentProfile.email || 'No email'
      },
      careerPaths: careerPaths || [],
      dailyTopics: dailyTopics || [],
      quizzes: quizzes || [],
      error: req.query.error || null,
      success: req.query.success || null
    });
  } catch (err) {
    console.error('Error viewing student progress:', err);
    return res.redirect('/mentor/dashboard?error=Failed to load student progress');
  }
};

// Remove a student from mentor
exports.removeStudent = async (req, res) => {
  try {
    const mentorId = req.session.mentor.id;
    const { studentId } = req.params;
    
    const result = mentorModel.removeStudentMentor(mentorId, studentId);
    
    if (!result.success) {
      return res.redirect(`/mentor/dashboard?error=${encodeURIComponent(result.message)}`);
    }
    
    return res.redirect(`/mentor/dashboard?success=${encodeURIComponent('Student removed successfully')}`);
  } catch (err) {
    console.error('Error removing student:', err);
    return res.redirect('/mentor/dashboard?error=Failed to remove student');
  }
};

// Get mentor profile page
exports.getMentorProfile = (req, res) => {
  try {
    // Get mentor from session
    const mentor = req.session.mentor;
    
    if (!mentor) {
      return res.redirect('/mentor/login');
    }
    
    res.render('mentorProfile', {
      mentor: mentor,
      error: req.query.error || null,
      success: req.query.success || null
    });
  } catch (err) {
    console.error('Error getting mentor profile:', err);
    return res.redirect('/mentor/dashboard?error=Failed to load profile');
  }
};

// List all mentors (for students to view)
exports.listMentors = async (req, res) => {
  try {
    const mentors = mentorModel.getAllMentors();
    
    // Check if student already has a mentor
    const studentId = req.user.id;
    const currentMentor = await mentorModel.getStudentMentor(studentId);
    
    // Get pending requests
    const pendingRequests = mentorModel.getStudentRequests(studentId);
    
    res.render('mentorsList', {
      user: req.user,
      mentors,
      currentMentor,
      pendingRequests,
      hasExistingMentor: !!currentMentor,
      error: req.query.error || null,
      success: req.query.success || null
    });
  } catch (err) {
    console.error('Error listing mentors:', err);
    res.render('mentorsList', {
      user: req.user,
      mentors: [],
      currentMentor: null,
      pendingRequests: [],
      hasExistingMentor: false,
      error: 'Failed to load mentors',
      success: null
    });
  }
};

// Request a mentor (for students)
exports.requestMentor = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { mentorId } = req.params;
    
    // Check if student already has a mentor
    const currentMentor = await mentorModel.getStudentMentor(studentId);
    
    if (currentMentor) {
      return res.redirect('/mentors?error=You already have a mentor');
    }
    
    // Check if student already has a pending request with this mentor
    const hasPendingRequest = mentorModel.hasPendingRequest(studentId, mentorId);
    
    if (hasPendingRequest) {
      return res.redirect('/mentors?error=You already have a pending request with this mentor');
    }
    
    // Send mentor request
    const result = mentorModel.requestMentor(studentId, mentorId);
    
    if (!result.success) {
      return res.redirect(`/mentors?error=${encodeURIComponent(result.message)}`);
    }
    
    return res.redirect(`/mentors?success=${encodeURIComponent(result.message)}`);
  } catch (err) {
    console.error('Error requesting mentor:', err);
    return res.redirect('/mentors?error=Failed to send mentor request');
  }
}; 