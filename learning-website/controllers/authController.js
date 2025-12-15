const supabase = require('../services/supabase');
const careerPathModel = require('../models/careerPath');

// Render signup page
exports.getSignupPage = (req, res) => {
  res.render('signup', { error: null, success: null });
};

// Handle user signup
exports.signup = async (req, res) => {
  const { email, password, confirmPassword } = req.body;
  
  // Basic validation
  if (!email || !password) {
    return res.render('signup', { 
      error: 'Email and password are required', 
      success: null 
    });
  }
  
  if (password !== confirmPassword) {
    return res.render('signup', { 
      error: 'Passwords do not match', 
      success: null 
    });
  }
  
  try {
    // Attempt to sign up the user with Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) {
      return res.render('signup', { 
        error: error.message, 
        success: null 
      });
    }
    
    // Success - user signed up
    return res.render('signup', { 
      error: null, 
      success: 'Signup successful! Please check your email to confirm your account.' 
    });
    
  } catch (err) {
    console.error('Signup error:', err);
    return res.render('signup', { 
      error: 'An unexpected error occurred', 
      success: null 
    });
  }
};

// Render login page
exports.getLoginPage = (req, res) => {
  res.render('login', { error: null });
};

// Handle user login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  
  // Basic validation
  if (!email || !password) {
    return res.render('login', { 
      error: 'Email and password are required' 
    });
  }
  
  try {
    // Attempt to log in the user with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      return res.render('login', { 
        error: error.message 
      });
    }
    
    // Check if user has a profile, if not create one
    const userId = data.user.id;
    let profile = await careerPathModel.getProfileByUserId(userId);
    
    if (!profile) {
      try {
        await careerPathModel.createProfile({
          user_id: userId,
          username: email.split('@')[0],
          email: email
        });
      } catch (profileError) {
        console.error('Error creating profile:', profileError);
        // Continue even if profile creation fails
      }
    }
    
    // Success - user logged in, redirect to dashboard
    return res.redirect('/home');
    
  } catch (err) {
    console.error('Login error:', err);
    return res.render('login', { 
      error: 'An unexpected error occurred' 
    });
  }
};

// Handle user logout
exports.logout = async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Logout error:', error);
    }
    
    return res.redirect('/');
  } catch (err) {
    console.error('Logout error:', err);
    return res.redirect('/');
  }
};

// Check if user is authenticated
exports.isAuthenticated = async (req, res, next) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return res.redirect('/login');
    }
    
    // Add user to request object
    req.user = session.user;
    next();
  } catch (err) {
    console.error('Authentication error:', err);
    return res.redirect('/login');
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    console.log('Update profile request received:', req.body);
    const userId = req.user.id;
    console.log('User ID:', userId);
    const { username, debug } = req.body;
    
    if (!username || username.trim() === '') {
      console.log('Username is empty');
      return res.redirect('/home?error=Name cannot be empty');
    }
    
    console.log('Updating profile with username:', username.trim());
    // Update profile in database
    const updatedProfile = await careerPathModel.updateProfile(userId, { username: username.trim() });
    
    if (!updatedProfile) {
      console.log('Failed to update profile');
      return res.redirect('/home?error=Failed to update profile');
    }
    
    console.log('Profile updated successfully:', updatedProfile);
    return res.redirect('/home?success=Your name has been updated successfully');
  } catch (err) {
    console.error('Error updating profile:', err);
    return res.redirect('/home?error=An error occurred while updating your profile');
  }
}; 