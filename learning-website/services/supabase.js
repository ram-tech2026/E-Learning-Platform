const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with retry logic
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  console.error('Required: SUPABASE_URL and SUPABASE_ANON_KEY');
  process.exit(1);
}

// Enhanced fetch with retry logic
const enhancedFetch = async (url, options, retries = 3, backoff = 300) => {
  try {
    return await fetch(url, options);
  } catch (err) {
    if (retries <= 1) {
      throw err;
    }
    
    console.warn(`Fetch error, retrying (${retries - 1} attempts left): ${err.message}`);
    
    // Wait with exponential backoff
    await new Promise(resolve => setTimeout(resolve, backoff));
    
    // Retry with increased backoff
    return enhancedFetch(url, options, retries - 1, backoff * 2);
  }
};

// Create Supabase client with custom fetch options for better reliability
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Don't persist session in Node.js environment
    autoRefreshToken: true,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'x-application-name': 'learning-website'
    },
    fetch: enhancedFetch
  },
  realtime: {
    timeout: 30000 // Increase timeout for realtime connections
  }
});

// Test connection and log status
const testConnection = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    console.log('Supabase connection established successfully');
    return true;
  } catch (err) {
    console.warn('Supabase connection warning:', err.message);
    console.log('Continuing with application startup...');
    return false;
  }
};

// Execute connection test but don't wait for it
testConnection();

// Helper function to handle Supabase errors consistently
supabase.handleError = (error, defaultMessage = 'Database operation failed') => {
  if (!error) return null;
  
  console.error('Supabase error:', error);
  
  // Format the error for client consumption
  return {
    message: error.message || defaultMessage,
    details: error.toString(),
    hint: error.hint || '',
    code: error.code || ''
  };
};

module.exports = supabase; 