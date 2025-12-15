const supabase = require('../services/supabase');

// Create a new quiz
exports.createQuiz = async (quizData) => {
  try {
    const { mentor_id, student_id, topic_id, topic_type, topic_name, questions, created_at = new Date() } = quizData;
    
    console.log('Creating quiz in database with data:', { 
      mentor_id, 
      student_id, 
      topic_id,
      topic_type,
      topic_name,
      questions_count: questions ? questions.length : 0
    });
    
    // Handle static mentor IDs (convert string like "1" to a proper UUID)
    let formattedMentorId = mentor_id;
    if (mentor_id && !mentor_id.includes('-')) {
      // This is a static mentor ID, convert it to a UUID format
      // For development, we'll use a deterministic UUID based on the mentor ID
      formattedMentorId = `00000000-0000-4000-a000-00000000000${mentor_id}`;
      console.log(`Converting static mentor ID "${mentor_id}" to UUID format: ${formattedMentorId}`);
    }
    
    // Ensure questions is properly formatted as JSON if it's not already
    const formattedQuestions = typeof questions === 'string' ? questions : JSON.stringify(questions);
    
    const { data, error } = await supabase
      .from('quizzes')
      .insert([{ 
        mentor_id: formattedMentorId, 
        student_id, 
        topic_id,
        topic_type, // 'career_path' or 'daily_topic'
        topic_name,
        questions: formattedQuestions,
        created_at,
        status: 'assigned' // assigned, completed
      }])
      .select();
      
    if (error) {
      console.error('Supabase error creating quiz:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.error('No data returned from quiz creation');
      return null;
    }
    
    console.log('Quiz created successfully with ID:', data[0].id);
    return data[0];
  } catch (err) {
    console.error('Error in createQuiz:', err);
    console.error('Error details:', err.message);
    if (err.stack) console.error('Stack trace:', err.stack);
    return null;
  }
};

// Get quizzes assigned to a student
exports.getQuizzesByStudentId = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error getting quizzes by student ID:', error);
      throw error;
    }
    
    return data || [];
  } catch (err) {
    console.error('Error in getQuizzesByStudentId:', err);
    return [];
  }
};

// Get quizzes created by a mentor
exports.getQuizzesByMentorId = async (mentorId) => {
  try {
    // Handle static mentor IDs (convert string like "1" to a proper UUID)
    let formattedMentorId = mentorId;
    if (mentorId && !mentorId.includes('-')) {
      // This is a static mentor ID, convert it to a UUID format
      formattedMentorId = `00000000-0000-4000-a000-00000000000${mentorId}`;
      console.log(`Converting static mentor ID "${mentorId}" to UUID format: ${formattedMentorId}`);
    }
    
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('mentor_id', formattedMentorId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error getting quizzes by mentor ID:', error);
      throw error;
    }
    
    return data || [];
  } catch (err) {
    console.error('Error in getQuizzesByMentorId:', err);
    return [];
  }
};

// Get a specific quiz by ID
exports.getQuizById = async (quizId) => {
  try {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .single();
      
    if (error) {
      console.error('Error getting quiz by ID:', error);
      throw error;
    }
    
    return data;
  } catch (err) {
    console.error('Error in getQuizById:', err);
    return null;
  }
};

// Update quiz with student's answers and results
exports.updateQuizResults = async (quizId, results) => {
  try {
    const { data, error } = await supabase
      .from('quizzes')
      .update({
        answers: results.answers,
        score: results.score,
        completed_at: new Date(),
        status: 'completed',
        strengths: results.strengths,
        weaknesses: results.weaknesses,
        updated_at: new Date()
      })
      .eq('id', quizId)
      .select();
      
    if (error) {
      console.error('Error updating quiz results:', error);
      throw error;
    }
    
    return data[0];
  } catch (err) {
    console.error('Error in updateQuizResults:', err);
    return null;
  }
};

// Delete a quiz
exports.deleteQuiz = async (quizId) => {
  try {
    const { error } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', quizId);
      
    if (error) {
      console.error('Error deleting quiz:', error);
      throw error;
    }
    
    return true;
  } catch (err) {
    console.error('Error in deleteQuiz:', err);
    return false;
  }
};

// Get questions for a quiz
exports.getQuizQuestions = async (quizId) => {
  try {
    const result = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quizId)
      .order('id');
    
    return result;
  } catch (error) {
    console.error('Error getting quiz questions:', error);
    return null;
  }
};

// Mark a quiz as completed
exports.completeQuiz = async (quizId, data) => {
  try {
    const { score, answers, strengths, weaknesses, completed_at } = data;
    
    const { data: updatedQuiz, error } = await supabase
      .from('quizzes')
      .update({
        status: 'completed',
        score: score,
        answers: answers,
        strengths: strengths,
        weaknesses: weaknesses,
        completed_at: completed_at,
        updated_at: new Date()
      })
      .eq('id', quizId)
      .select();
    
    if (error) {
      console.error('Error completing quiz:', error);
      throw error;
    }
    
    return updatedQuiz[0];
  } catch (error) {
    console.error('Error completing quiz:', error);
    return null;
  }
}; 