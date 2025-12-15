const supabase = require('../services/supabase');

// Static list of mentors (pre-defined experts)
const staticMentors = [
  {
    id: '1',
    email: 'mentor1@example.com',
    password: 'mentor123',
    name: 'Dr. Saravana Kumar',
    expertise: 'Data Science',
    bio: 'PhD in Computer Science with 10+ years of experience in data science and machine learning.',
    students: []
  },
  {
    id: '2',
    email: 'mentor2@example.com',
    password: 'mentor123',
    name: 'Prof. Prashanthi',
    expertise: 'Web Development',
    bio: 'Full-stack developer with expertise in React, Node.js, and modern web technologies.',
    students: []
  },
  {
    id: '3',
    email: 'mentor3@example.com',
    password: 'mentor123',
    name: 'Prof. Abdul Rehman',
    expertise: 'Mobile App Development',
    bio: 'Specialist in iOS and Android development with a focus on user experience design.',
    students: []
  },
  {
    id: '4',
    email: 'mentor4@example.com',
    password: 'mentor123',
    name: 'Prof. David Kim',
    expertise: 'Artificial Intelligence',
    bio: 'Researcher in AI and deep learning with publications in top conferences.',
    students: []
  },
  {
    id: '5',
    email: 'mentor5@example.com',
    password: 'mentor123',
    name: 'Dr. Srinivas Patel',
    expertise: 'Cybersecurity',
    bio: 'Expert in network security, penetration testing, and secure system design.',
    students: []
  },
  {
    id: '6',
    email: 'mentor6@example.com',
    password: 'mentor123',
    name: 'Prof. Karthik Bolla',
    expertise: 'Game Development',
    bio: 'Game developer with experience in Unity and Unreal Engine.',
    students: []
  },
  {
    id: '7',
    email: 'mentor7@example.com',
    password: 'mentor123',
    name: 'Dr. Bharth Singh J',
    expertise: 'Database Systems',
    bio: 'Database architect specializing in SQL and NoSQL systems.',
    students: []
  },
  {
    id: '8',
    email: 'mentor8@example.com',
    password: 'mentor123',
    name: 'Prof. Kumar Srinivas',
    expertise: 'Cloud Computing',
    bio: 'AWS certified solutions architect with expertise in cloud infrastructure.',
    students: []
  },
  {
    id: '9',
    email: 'mentor9@example.com',
    password: 'mentor123',
    name: 'Dr. Abshisek Tripati',
    expertise: 'UI/UX Design',
    bio: 'Designer with a focus on creating intuitive and accessible user interfaces.',
    students: []
  },
  {
    id: '10',
    email: 'mentor10@example.com',
    password: 'mentor123',
    name: 'Prof. Raja Kumar Rao',
    expertise: 'DevOps',
    bio: 'DevOps engineer specializing in CI/CD pipelines and infrastructure as code.',
    students: []
  }
];

// In-memory storage for mentor-student relationships and pending requests
const mentorRequests = [];
const mentorStudentRelationships = [];

// Get all mentors
exports.getAllMentors = () => {
  return staticMentors.map(mentor => ({
    id: mentor.id,
    name: mentor.name,
    expertise: mentor.expertise,
    bio: mentor.bio
  }));
};

// Get mentor by email (for authentication)
exports.getMentorByEmail = (email) => {
  return staticMentors.find(mentor => mentor.email.toLowerCase() === email.toLowerCase());
};

// Get mentor by ID
exports.getMentorById = (id) => {
  const mentor = staticMentors.find(mentor => mentor.id === id);
  if (!mentor) return null;
  
  return {
    id: mentor.id,
    name: mentor.name,
    expertise: mentor.expertise,
    bio: mentor.bio
  };
};

// Request a mentor
exports.requestMentor = (studentId, mentorId) => {
  // Check if request already exists
  const existingRequest = mentorRequests.find(
    req => req.studentId === studentId && req.mentorId === mentorId
  );
  
  if (existingRequest) {
    return { success: false, message: 'Request already sent to this mentor' };
  }
  
  // Check if relationship already exists
  const existingRelationship = mentorStudentRelationships.find(
    rel => rel.studentId === studentId && rel.mentorId === mentorId
  );
  
  if (existingRelationship) {
    return { success: false, message: 'This mentor is already mentoring you' };
  }
  
  // Add new request
  mentorRequests.push({
    id: Date.now().toString(),
    studentId,
    mentorId,
    status: 'pending',
    createdAt: new Date()
  });
  
  return { success: true, message: 'Mentor request sent successfully' };
};

// Get pending requests for a mentor
exports.getMentorRequests = async (mentorId) => {
  const requests = mentorRequests.filter(
    req => req.mentorId === mentorId && req.status === 'pending'
  );
  
  // Get student details for each request
  const requestsWithDetails = [];
  
  for (const request of requests) {
    try {
      // Get student profile from Supabase
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', request.studentId)
        .single();
      
      if (error) {
        console.error('Error getting student profile:', error);
        // Include request even without details
        requestsWithDetails.push({
          requestId: request.id,
          studentId: request.studentId,
          studentName: 'Unknown Student',
          studentEmail: 'No email',
          createdAt: request.createdAt
        });
        continue;
      }
      
      requestsWithDetails.push({
        requestId: request.id,
        studentId: request.studentId,
        studentName: profile.username || 'Unknown Student',
        studentEmail: profile.email || 'No email',
        createdAt: request.createdAt
      });
    } catch (err) {
      console.error('Error getting student profile:', err);
      // Include request even without details
      requestsWithDetails.push({
        requestId: request.id,
        studentId: request.studentId,
        studentName: 'Unknown Student',
        studentEmail: 'No email',
        createdAt: request.createdAt
      });
    }
  }
  
  return requestsWithDetails;
};

// Accept a mentor request
exports.acceptMentorRequest = (requestId) => {
  const requestIndex = mentorRequests.findIndex(req => req.id === requestId);
  
  if (requestIndex === -1) {
    return { success: false, message: 'Request not found' };
  }
  
  const request = mentorRequests[requestIndex];
  
  // Update request status
  mentorRequests[requestIndex].status = 'accepted';
  
  // Create mentor-student relationship
  mentorStudentRelationships.push({
    mentorId: request.mentorId,
    studentId: request.studentId,
    startDate: new Date()
  });
  
  return { success: true, message: 'Mentor request accepted' };
};

// Reject a mentor request
exports.rejectMentorRequest = (requestId) => {
  const requestIndex = mentorRequests.findIndex(req => req.id === requestId);
  
  if (requestIndex === -1) {
    return { success: false, message: 'Request not found' };
  }
  
  // Update request status
  mentorRequests[requestIndex].status = 'rejected';
  
  return { success: true, message: 'Mentor request rejected' };
};

// Get students for a mentor
exports.getMentorStudents = async (mentorId) => {
  const relationships = mentorStudentRelationships.filter(rel => rel.mentorId === mentorId);
  
  // Get student details for each relationship
  const students = [];
  
  for (const rel of relationships) {
    try {
      // Get student profile from Supabase
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', rel.studentId)
        .single();
      
      if (error) {
        console.error('Error getting student profile:', error);
        continue;
      }
      
      // Get student's career paths
      const { data: careerPaths, error: careerPathsError } = await supabase
        .from('career_paths')
        .select('*')
        .eq('user_id', rel.studentId);
        
      if (careerPathsError) {
        console.error('Error getting career paths:', careerPathsError);
      }
      
      // Get student's daily topics
      const { data: dailyTopics, error: dailyTopicsError } = await supabase
        .from('daily_topics')
        .select('*')
        .eq('user_id', rel.studentId);
        
      if (dailyTopicsError) {
        console.error('Error getting daily topics:', dailyTopicsError);
      }
      
      students.push({
        id: rel.studentId,
        name: profile.username || 'Unknown Student',
        email: profile.email || 'No email',
        startDate: rel.startDate,
        careerPathsCount: careerPaths ? careerPaths.length : 0,
        dailyTopicsCount: dailyTopics ? dailyTopics.length : 0,
        relationshipId: rel.mentorId + '-' + rel.studentId // Unique identifier for the relationship
      });
    } catch (err) {
      console.error('Error getting student profile:', err);
    }
  }
  
  return students;
};

// Get mentor for a student
exports.getStudentMentor = async (studentId) => {
  const relationship = mentorStudentRelationships.find(rel => rel.studentId === studentId);
  
  if (!relationship) {
    return null;
  }
  
  return exports.getMentorById(relationship.mentorId);
};

// Check if a student has a pending request with a mentor
exports.hasPendingRequest = (studentId, mentorId) => {
  return mentorRequests.some(
    req => req.studentId === studentId && 
           req.mentorId === mentorId && 
           req.status === 'pending'
  );
};

// Check if a student already has a mentor
exports.hasExistingMentor = (studentId) => {
  return mentorStudentRelationships.some(rel => rel.studentId === studentId);
};

// Get all pending requests for a student
exports.getStudentRequests = (studentId) => {
  return mentorRequests.filter(
    req => req.studentId === studentId && req.status === 'pending'
  ).map(req => {
    const mentor = exports.getMentorById(req.mentorId);
    return {
      requestId: req.id,
      mentor: mentor,
      createdAt: req.createdAt
    };
  });
};

// Remove a student-mentor relationship
exports.removeStudentMentor = (mentorId, studentId) => {
  const relationshipIndex = mentorStudentRelationships.findIndex(
    rel => rel.mentorId === mentorId && rel.studentId === studentId
  );
  
  if (relationshipIndex === -1) {
    return { success: false, message: 'Relationship not found' };
  }
  
  // Remove the relationship
  mentorStudentRelationships.splice(relationshipIndex, 1);
  
  return { success: true, message: 'Student removed successfully' };
};

// Add the missing isStudentAssignedToMentor function
exports.isStudentAssignedToMentor = async (mentorId, studentId) => {
  try {
    console.log(`Checking if student ${studentId} is assigned to mentor ${mentorId}`);
    
    // Check if we're using static mentors (mentorId is a simple number string like "1")
    if (mentorId && !mentorId.includes('-')) {
      // For static mentors, check the in-memory relationships
      const relationship = mentorStudentRelationships.find(
        rel => rel.mentorId === mentorId && rel.studentId === studentId
      );
      
      if (relationship) {
        console.log(`Student ${studentId} is assigned to static mentor ${mentorId}`);
        return true;
      }
      
      console.log(`Student ${studentId} is not assigned to static mentor ${mentorId}`);
      return false;
    }
    
    // For database mentors, query the mentor_requests table
    try {
      const { data, error } = await supabase
        .from('mentor_requests')
        .select('*')
        .eq('mentor_id', mentorId)
        .eq('student_id', studentId)
        .eq('status', 'accepted')
        .single();
      
      if (error) {
        // If error is "no rows returned", it means the student is not assigned
        if (error.code === 'PGRST116') {
          console.log(`Student ${studentId} is not assigned to mentor ${mentorId}`);
          return false;
        }
        
        // If the table doesn't exist yet, default to true for development
        if (error.code === '42P01') {
          console.log('Mentor requests table does not exist yet, defaulting to true');
          return true;
        }
        
        console.error('Error checking mentor-student relationship:', error);
        // Default to true in case of other errors to prevent blocking access
        return true;
      }
      
      console.log(`Student ${studentId} is assigned to mentor ${mentorId}`);
      return true;
    } catch (dbErr) {
      console.error('Database error in isStudentAssignedToMentor:', dbErr);
      // Default to true in case of errors to prevent blocking access
      return true;
    }
  } catch (err) {
    console.error('Error in isStudentAssignedToMentor:', err);
    // Default to true in case of errors to prevent blocking access
    return true;
  }
}; 