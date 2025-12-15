const careerPathModel = require('../models/careerPath');
const supabase = require('../services/supabase');

// Render home page with career paths
exports.getHomePage = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user profile
    const profile = await careerPathModel.getProfileByUserId(userId);
    
    // Get career paths for this user
    const careerPaths = await careerPathModel.getCareerPathsByUserId(userId);
    
    // Daily topics are added by the dailyTopicsController middleware
    const dailyTopics = req.dailyTopics || [];
    
    // Quizzes are added by the quizController middleware
    const quizzes = req.quizzes || [];
    console.log(`Rendering home page with ${quizzes.length} quizzes for user ${userId}`);
    
    res.render('home', { 
      user: req.user,
      profile: profile,
      careerPaths: careerPaths,
      dailyTopics: dailyTopics,
      quizzes: quizzes,
      error: req.query.error || null,
      success: req.query.success || null
    });
  } catch (err) {
    console.error('Error getting home page:', err);
    res.render('home', { 
      user: req.user,
      profile: null,
      careerPaths: [],
      dailyTopics: [],
      quizzes: [],
      error: 'Failed to load your dashboard data'
    });
  }
};

// Create a new career path
exports.createCareerPath = async (req, res) => {
  try {
    const userId = req.user.id;
    const { learning_goal } = req.body;
    
    // Validate input
    if (!learning_goal) {
      // Check if this is an API request
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.status(400).json({ 
          success: false, 
          error: 'Learning goal is required' 
        });
      }
      return res.redirect('/home?error=Learning goal is required');
    }
    
    // Create the career path
    const newPath = await careerPathModel.createCareerPath({
      user_id: userId,
      learning_goal,
      status: 'in_progress'
    });
    
    // Check if this is an API request
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.json({ 
        success: true, 
        message: 'Career path created successfully',
        careerPath: newPath
      });
    }
    
    // Redirect to home page with success message
    res.redirect('/home?success=Career path created successfully');
    
  } catch (err) {
    console.error('Error creating career path:', err);
    
    // Check if this is an API request
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to create career path' 
      });
    }
    
    res.redirect('/home?error=Failed to create career path');
  }
};

// Get career path details with milestones
exports.getCareerPathDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const pathId = req.params.id;
    
    // Get career path with milestones
    const careerPath = await careerPathModel.getCareerPathWithMilestones(pathId);
    
    if (!careerPath) {
      return res.status(404).render('404', { 
        title: 'Career Path Not Found',
        user: req.user
      });
    }
    
    // Check if the career path belongs to the current user
    if (careerPath.user_id !== userId) {
      return res.status(403).render('error', { 
        title: 'Unauthorized',
        error: 'You do not have permission to view this career path',
        user: req.user
      });
    }
    
    // Get success and error messages from query params
    const success = req.query.success || null;
    const error = req.query.error || null;
    
    // Render career path details page
    res.render('careerPathDetails', {
      user: req.user,
      careerPath,
      error,
      success
    });
    
  } catch (err) {
    console.error('Error getting career path details:', err);
    res.redirect('/home?error=Failed to load career path details');
  }
};

// Add milestone to career path
exports.addMilestone = async (req, res) => {
  try {
    const userId = req.user.id;
    const pathId = req.params.id;
    const { milestone_name } = req.body;
    
    // Validate input
    if (!milestone_name) {
      return res.redirect(`/career-paths/${pathId}?error=Milestone name is required`);
    }
    
    // Get the career path to check ownership
    const careerPath = await careerPathModel.getCareerPathById(pathId);
    
    if (!careerPath) {
      return res.redirect('/home?error=Career path not found');
    }
    
    // Check if the career path belongs to the current user
    if (careerPath.user_id !== userId) {
      return res.redirect('/home?error=You do not have permission to modify this career path');
    }
    
    // Create the milestone
    await careerPathModel.createMilestone({
      career_path_id: pathId,
      milestone_name,
      status: 'not_started'
    });
    
    // Redirect to career path details page
    res.redirect(`/career-paths/${pathId}?success=Milestone added successfully`);
    
  } catch (err) {
    console.error('Error adding milestone:', err);
    res.redirect(`/career-paths/${req.params.id}?error=Failed to add milestone`);
  }
};

// Update milestone status
exports.updateMilestoneStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const pathId = req.params.pathId;
    const milestoneId = req.params.milestoneId;
    const { status } = req.body;
    
    // Validate input
    if (!status) {
      return res.redirect(`/career-paths/${pathId}?error=Status is required`);
    }
    
    // Get the career path to check ownership
    const careerPath = await careerPathModel.getCareerPathById(pathId);
    
    if (!careerPath) {
      return res.redirect('/home?error=Career path not found');
    }
    
    // Check if the career path belongs to the current user
    if (careerPath.user_id !== userId) {
      return res.redirect('/home?error=You do not have permission to modify this career path');
    }
    
    // Update the milestone
    await careerPathModel.updateMilestone(milestoneId, { status });
    
    // Redirect to career path details page
    res.redirect(`/career-paths/${pathId}?success=Milestone updated successfully`);
    
  } catch (err) {
    console.error('Error updating milestone:', err);
    res.redirect(`/career-paths/${req.params.pathId}?error=Failed to update milestone`);
  }
};

// Update career path status
exports.updateCareerPathStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const pathId = req.params.id;
    const { status } = req.body;
    
    // Validate input
    if (!status) {
      return res.redirect(`/career-paths/${pathId}?error=Status is required`);
    }
    
    // Validate status value
    const validStatuses = ['not_started', 'in_progress', 'completed', 'on_hold'];
    if (!validStatuses.includes(status)) {
      return res.redirect(`/career-paths/${pathId}?error=Invalid status value`);
    }
    
    // Get the career path to check ownership
    const careerPath = await careerPathModel.getCareerPathById(pathId);
    
    if (!careerPath) {
      return res.redirect('/home?error=Career path not found');
    }
    
    // Check if the career path belongs to the current user
    if (careerPath.user_id !== userId) {
      return res.redirect('/home?error=You do not have permission to modify this career path');
    }
    
    // Update the career path status
    await careerPathModel.updateCareerPath(pathId, { status });
    
    // Redirect to career path details page
    res.redirect(`/career-paths/${pathId}?success=Career path status updated successfully`);
    
  } catch (err) {
    console.error('Error updating career path status:', err);
    res.redirect(`/career-paths/${req.params.id}?error=Failed to update career path status`);
  }
};

// Delete career path
exports.deleteCareerPath = async (req, res) => {
  try {
    const userId = req.user.id;
    const pathId = req.params.id;
    
    // Get the career path to check ownership
    const careerPath = await careerPathModel.getCareerPathById(pathId);
    
    if (!careerPath) {
      return res.redirect('/home?error=Career path not found');
    }
    
    // Check if the career path belongs to the current user
    if (careerPath.user_id !== userId) {
      return res.redirect('/home?error=You do not have permission to delete this career path');
    }
    
    // Delete all milestones for this career path
    const milestones = await careerPathModel.getMilestonesByCareerPathId(pathId);
    for (const milestone of milestones) {
      await careerPathModel.deleteMilestone(milestone.id);
    }
    
    // Delete the career path
    await careerPathModel.deleteCareerPath(pathId);
    
    // Redirect to home page
    res.redirect('/home?success=Career path deleted successfully');
    
  } catch (err) {
    console.error('Error deleting career path:', err);
    res.redirect('/home?error=Failed to delete career path');
  }
}; 