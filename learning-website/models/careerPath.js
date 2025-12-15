const supabase = require('../services/supabase');

// Profiles table operations
exports.createProfile = async (userData) => {
  try {
    const { user_id, username, email } = userData;
    
    // First check if profile already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user_id)
      .single();
      
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing profile:', checkError);
      throw checkError;
    }
      
    if (existingProfile) {
      return existingProfile; // Profile already exists, return it
    }
    
    // Create new profile with retry logic
    let retries = 3;
    let lastError = null;
    
    while (retries > 0) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .insert([{ 
            user_id, 
            username, 
            email 
          }])
          .select();
          
        if (error) {
          throw error;
        }
        
        return data[0];
      } catch (err) {
        lastError = err;
        console.warn(`Error creating profile, retrying (${retries} attempts left):`, err.message);
        retries--;
        
        // Wait before retrying
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    // If we get here, all retries failed
    console.error('All attempts to create profile failed:', lastError);
    
    // Return a minimal profile object to prevent cascading errors
    return {
      user_id: userData.user_id,
      username: userData.username || userData.email.split('@')[0],
      email: userData.email,
      is_fallback: true, // Flag to indicate this is a fallback profile
      error: lastError ? lastError.message : 'Failed to create profile after multiple attempts'
    };
  } catch (err) {
    console.error('Error creating profile:', err);
    // Return a minimal profile object to prevent cascading errors
    return {
      user_id: userData.user_id,
      username: userData.username || userData.email.split('@')[0],
      email: userData.email,
      is_fallback: true, // Flag to indicate this is a fallback profile
      error: err.message
    };
  }
};

exports.getProfileByUserId = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') { // "no rows returned"
        return null;
      }
      console.error('Error in getProfileByUserId:', error);
      throw error;
    }
    
    return data;
  } catch (err) {
    console.error('Error getting profile:', err);
    return null;
  }
};

exports.updateProfile = async (userId, updates) => {
  try {
    console.log('Updating profile for user:', userId);
    console.log('Updates:', updates);
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', userId)
      .select();
      
    if (error) {
      console.error('Error in updateProfile:', error);
      throw error;
    }
    
    console.log('Profile update result:', data);
    return data[0];
  } catch (err) {
    console.error('Error updating profile:', err);
    return null;
  }
};

// Career Paths operations
exports.createCareerPath = async (careerPathData) => {
  const { user_id, learning_goal, status = 'in_progress' } = careerPathData;
  
  const { data, error } = await supabase
    .from('career_paths')
    .insert([{ user_id, learning_goal, status }])
    .select();
    
  if (error) throw error;
  return data[0];
};

exports.getCareerPathsByUserId = async (userId) => {
  const { data, error } = await supabase
    .from('career_paths')
    .select('*')
    .eq('user_id', userId);
    
  if (error) throw error;
  return data || [];
};

exports.getCareerPathById = async (pathId) => {
  const { data, error } = await supabase
    .from('career_paths')
    .select('*')
    .eq('id', pathId)
    .single();
    
  if (error) throw error;
  return data;
};

exports.updateCareerPath = async (pathId, updates) => {
  const { data, error } = await supabase
    .from('career_paths')
    .update(updates)
    .eq('id', pathId)
    .select();
    
  if (error) throw error;
  return data[0];
};

exports.deleteCareerPath = async (pathId) => {
  const { error } = await supabase
    .from('career_paths')
    .delete()
    .eq('id', pathId);
    
  if (error) throw error;
  return true;
};

// Career Milestones operations
exports.createMilestone = async (milestoneData) => {
  const { career_path_id, milestone_name, status = 'not_started' } = milestoneData;
  
  const { data, error } = await supabase
    .from('career_milestones')
    .insert([{ career_path_id, milestone_name, status }])
    .select();
    
  if (error) throw error;
  return data[0];
};

exports.getMilestonesByCareerPathId = async (careerPathId) => {
  const { data, error } = await supabase
    .from('career_milestones')
    .select('*')
    .eq('career_path_id', careerPathId);
    
  if (error) throw error;
  return data || [];
};

exports.updateMilestone = async (milestoneId, updates) => {
  const { data, error } = await supabase
    .from('career_milestones')
    .update(updates)
    .eq('id', milestoneId)
    .select();
    
  if (error) throw error;
  return data[0];
};

exports.deleteMilestone = async (milestoneId) => {
  const { error } = await supabase
    .from('career_milestones')
    .delete()
    .eq('id', milestoneId);
    
  if (error) throw error;
  return true;
};

// Get career path with its milestones
exports.getCareerPathWithMilestones = async (pathId) => {
  // Get the career path
  const careerPath = await exports.getCareerPathById(pathId);
  
  if (!careerPath) return null;
  
  // Get the milestones for this career path
  const milestones = await exports.getMilestonesByCareerPathId(pathId);
  
  // Combine the data
  return {
    ...careerPath,
    milestones
  };
}; 