const dailyTopicsModel = require('../models/dailyTopics');

// Get daily topics for the dashboard
exports.getDailyTopics = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get daily topics for the user
    const dailyTopics = await dailyTopicsModel.getDailyTopicsByUserId(userId);
    
    // Render the daily topics view
    res.render('dailyTopics', {
      user: req.user,
      dailyTopics,
      error: req.query.error || null,
      success: req.query.success || null
    });
    
  } catch (err) {
    console.error('Error getting daily topics:', err);
    res.redirect('/home?error=Failed to load daily topics');
  }
};

// Create a new daily topic
exports.createDailyTopic = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, estimated_minutes } = req.body;
    
    // Validate input
    if (!title) {
      // Check if this is an API request
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.status(400).json({ 
          success: false, 
          error: 'Title is required' 
        });
      }
      return res.redirect('/daily-topics?error=Title is required');
    }
    
    // Create the daily topic
    const newTopic = await dailyTopicsModel.createDailyTopic({
      user_id: userId,
      title,
      description: description || '',
      estimated_minutes: parseInt(estimated_minutes) || 30,
      status: 'pending'
    });
    
    // Check if this is an API request
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.json({ 
        success: true, 
        message: 'Daily topic created successfully',
        topic: newTopic
      });
    }
    
    // Redirect to daily topics page with success message
    res.redirect('/daily-topics?success=Daily topic created successfully');
    
  } catch (err) {
    console.error('Error creating daily topic:', err);
    
    // Check if this is an API request
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to create daily topic' 
      });
    }
    
    res.redirect('/daily-topics?error=Failed to create daily topic');
  }
};

// Update daily topic status
exports.updateDailyTopicStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const topicId = req.params.id;
    const { status } = req.body;
    
    // Validate input
    if (!status) {
      // Check if this is an API request
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.status(400).json({ 
          success: false, 
          error: 'Status is required' 
        });
      }
      return res.redirect(`/daily-topics?error=Status is required`);
    }
    
    // Validate status value
    const validStatuses = ['pending', 'in_progress', 'completed'];
    if (!validStatuses.includes(status)) {
      // Check if this is an API request
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid status value' 
        });
      }
      return res.redirect(`/daily-topics?error=Invalid status value`);
    }
    
    // Get the daily topic to check ownership
    const dailyTopic = await dailyTopicsModel.getDailyTopicById(topicId);
    
    if (!dailyTopic) {
      // Check if this is an API request
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.status(404).json({ 
          success: false, 
          error: 'Daily topic not found' 
        });
      }
      return res.redirect('/daily-topics?error=Daily topic not found');
    }
    
    // Check if the daily topic belongs to the current user
    if (dailyTopic.user_id !== userId) {
      // Check if this is an API request
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.status(403).json({ 
          success: false, 
          error: 'You do not have permission to modify this daily topic' 
        });
      }
      return res.redirect('/daily-topics?error=You do not have permission to modify this daily topic');
    }
    
    // Update the daily topic status
    const updatedTopic = await dailyTopicsModel.updateDailyTopic(topicId, { status });
    
    // If this is an AJAX request, return JSON response
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.json({ 
        success: true, 
        message: 'Status updated successfully',
        topic: updatedTopic
      });
    }
    
    // Redirect to daily topics page with success message
    res.redirect(`/daily-topics?success=Daily topic status updated successfully`);
    
  } catch (err) {
    console.error('Error updating daily topic status:', err);
    
    // If this is an AJAX request, return JSON response
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to update status' 
      });
    }
    
    res.redirect(`/daily-topics?error=Failed to update daily topic status`);
  }
};

// Delete a daily topic
exports.deleteDailyTopic = async (req, res) => {
  try {
    const userId = req.user.id;
    const topicId = req.params.id;
    
    // Get the daily topic to check ownership
    const dailyTopic = await dailyTopicsModel.getDailyTopicById(topicId);
    
    if (!dailyTopic) {
      // Check if this is an API request
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.status(404).json({ 
          success: false, 
          error: 'Daily topic not found' 
        });
      }
      return res.redirect('/daily-topics?error=Daily topic not found');
    }
    
    // Check if the daily topic belongs to the current user
    if (dailyTopic.user_id !== userId) {
      // Check if this is an API request
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.status(403).json({ 
          success: false, 
          error: 'You do not have permission to delete this daily topic' 
        });
      }
      return res.redirect('/daily-topics?error=You do not have permission to delete this daily topic');
    }
    
    // Delete the daily topic
    await dailyTopicsModel.deleteDailyTopic(topicId);
    
    // Check if this is an API request
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.json({ 
        success: true, 
        message: 'Daily topic deleted successfully' 
      });
    }
    
    // Redirect to daily topics page with success message
    res.redirect('/daily-topics?success=Daily topic deleted successfully');
    
  } catch (err) {
    console.error('Error deleting daily topic:', err);
    
    // Check if this is an API request
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to delete daily topic' 
      });
    }
    
    res.redirect('/daily-topics?error=Failed to delete daily topic');
  }
};

// Get daily topics for the home dashboard
exports.getDailyTopicsForHome = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Get daily topics for the user
    const dailyTopics = await dailyTopicsModel.getDailyTopicsByUserId(userId);
    
    // Add daily topics to the request object
    req.dailyTopics = dailyTopics;
    
    // Continue to the next middleware
    next();
    
  } catch (err) {
    console.error('Error getting daily topics for home:', err);
    // Continue to the next middleware even if there's an error
    req.dailyTopics = [];
    next();
  }
}; 