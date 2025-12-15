const supabase = require('../services/supabase');

// Create a new daily topic
exports.createDailyTopic = async (topicData) => {
  const { user_id, title, description, estimated_minutes, status = 'pending' } = topicData;
  
  const { data, error } = await supabase
    .from('daily_topics')
    .insert([{ 
      user_id, 
      title, 
      description, 
      estimated_minutes, 
      status 
    }])
    .select();
    
  if (error) throw error;
  return data[0];
};

// Get all daily topics for a user
exports.getDailyTopicsByUserId = async (userId) => {
  const { data, error } = await supabase
    .from('daily_topics')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data || [];
};

// Get a specific daily topic by ID
exports.getDailyTopicById = async (topicId) => {
  const { data, error } = await supabase
    .from('daily_topics')
    .select('*')
    .eq('id', topicId)
    .single();
    
  if (error) throw error;
  return data;
};

// Update a daily topic
exports.updateDailyTopic = async (topicId, updates) => {
  const { data, error } = await supabase
    .from('daily_topics')
    .update(updates)
    .eq('id', topicId)
    .select();
    
  if (error) throw error;
  return data[0];
};

// Delete a daily topic
exports.deleteDailyTopic = async (topicId) => {
  const { error } = await supabase
    .from('daily_topics')
    .delete()
    .eq('id', topicId);
    
  if (error) throw error;
  return true;
};

// Get daily topics with filters (status, date range, etc.)
exports.getFilteredDailyTopics = async (userId, filters = {}) => {
  let query = supabase
    .from('daily_topics')
    .select('*')
    .eq('user_id', userId);
  
  // Apply status filter if provided
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  
  // Apply date range filter if provided
  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate);
  }
  
  if (filters.endDate) {
    query = query.lte('created_at', filters.endDate);
  }
  
  // Apply sorting
  const sortColumn = filters.sortBy || 'created_at';
  const sortOrder = filters.sortOrder || { ascending: false };
  query = query.order(sortColumn, sortOrder);
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data || [];
}; 