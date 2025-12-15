# Learning Website

A modern, full-featured learning platform for students and mentors. Track your learning journey, take quizzes, get AI-powered recommendations, and connect with mentors. Built with Node.js, Express, EJS, and Supabase.

## Features

### For Students
- 🔐 **Secure Authentication**: Signup/login with email and password using Supabase Auth
- 📚 **Career Paths**: Create and manage personalized learning paths
- 🎯 **Milestones**: Break down learning goals into achievable milestones
- 📖 **Daily Topics**: Track daily learning activities and progress
- 🤖 **AI Recommendations**: Get personalized learning recommendations powered by Google Gemini AI
- 📝 **Quizzes**: Take quizzes to test your knowledge and track results
- 👨‍🏫 **Mentor Requests**: Request mentorship from experienced professionals
- 📊 **Progress Tracking**: Monitor your learning progress with detailed analytics

### For Mentors
- 👤 **Mentor Dashboard**: Dedicated dashboard for managing students
- 📝 **Quiz Management**: Create and manage quizzes for students
- 📈 **Student Progress**: View and track student performance
- 🎓 **Mentor Profile**: Showcase your expertise and availability

### General
- 📱 **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- 🎨 **Modern UI**: Clean, professional interface with smooth animations
- ⚡ **Fast Performance**: Optimized for speed and efficiency

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+), EJS Templates
- **Backend**: Node.js (v14+), Express.js
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth with Row Level Security (RLS)
- **AI Integration**: Google Gemini AI
- **Session Management**: Express Session
- **Styling**: Custom CSS with animations
- **Environment Management**: dotenv

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v14 or higher)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- A [Supabase](https://supabase.com/) account
- A [Google AI Studio](https://makersuite.google.com/app/apikey) API key (for Gemini AI)

## Installation

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/learning-website.git
cd learning-website
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Create a `.env` file in the root directory:
```env
# Server Configuration
PORT=3001

# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key

# Google Gemini AI Configuration
GEMINI_API_KEY=your-gemini-api-key

# Session Secret (generate a random string)
SESSION_SECRET=your-random-session-secret
```

**How to get your credentials:**
- **Supabase**: Go to your [Supabase Dashboard](https://app.supabase.com/) → Project Settings → API
- **Gemini AI**: Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### 4. Set up the database

#### a. Create tables
Run the following SQL scripts in your Supabase SQL Editor (in order):

1. **schema.sql** - Creates all required tables
2. **fix_permissions.sql** - Sets up Row Level Security policies
3. **mentor_requests_table.sql** - Creates mentor requests table
4. **quizzes_table.sql** - Creates quizzes and related tables

#### b. Enable required extensions
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 5. Start the application

#### Development mode:
```bash
npm start
```

#### Production mode (with PM2):
```bash
npm install -g pm2
pm2 start app.js --name learning-website
```

### 6. Access the application
Open your browser and navigate to:
```
http://localhost:3001
```

## Project Structure

```
learning-website/
├── app.js                      # Main application entry point
├── package.json                # Dependencies and scripts
├── .env                        # Environment variables (create this)
├── .gitignore                  # Git ignore file
├── README.md                   # Project documentation
│
├── controllers/                # Route controllers
│   ├── authController.js       # Authentication logic
│   ├── careerPathController.js # Career path management
│   ├── dailyTopicsController.js# Daily topics tracking
│   ├── mentorController.js     # Mentor functionality
│   ├── quizController.js       # Quiz management
│   └── aiController.js         # AI recommendations
│
├── models/                     # Data models
│   ├── careerPath.js           # Career path model
│   ├── dailyTopics.js          # Daily topics model
│   ├── mentor.js               # Mentor model
│   ├── mentors.js              # Mentors listing model
│   └── quiz.js                 # Quiz model
│
├── services/                   # External services
│   ├── supabase.js             # Supabase client configuration
│   └── gemini.js               # Google Gemini AI integration
│
├── views/                      # EJS templates
│   ├── home.ejs                # Landing page
│   ├── login.ejs               # Login page
│   ├── signup.ejs              # Signup page
│   ├── index.ejs               # Student dashboard
│   ├── careerPathDetails.ejs   # Career path details
│   ├── dailyTopics.ejs         # Daily topics page
│   ├── aiRecommendations.ejs   # AI recommendations
│   ├── studentQuizzes.ejs      # Student quiz list
│   ├── takeQuiz.ejs            # Quiz taking interface
│   ├── quizResults.ejs         # Quiz results
│   ├── studentProgress.ejs     # Progress tracking
│   ├── mentorsList.ejs         # Available mentors
│   ├── mentorLogin.ejs         # Mentor login
│   ├── mentorDashboard.ejs     # Mentor dashboard
│   ├── mentorProfile.ejs       # Mentor profile
│   ├── mentorQuizzes.ejs       # Mentor quiz management
│   ├── mentorQuizResults.ejs   # Mentor view of results
│   ├── studentQuizResults.ejs  # Student quiz performance
│   ├── error.ejs               # Error page
│   └── 404.ejs                 # 404 page
│
├── public/                     # Static assets
│   ├── css/
│   │   ├── style.css           # Main styles
│   │   └── animations.css      # CSS animations
│   ├── js/
│   │   └── main.js             # Client-side JavaScript
│   └── images/
│       └── icons/              # Icon assets
│
└── db/                         # Database scripts
    └── fix_permissions.sql     # RLS policies
```

## Database Schema

### Main Tables
- **profiles** - User profile information
- **career_paths** - Learning paths created by users
- **career_milestones** - Milestones for each learning path
- **daily_topics** - Daily learning activities
- **mentors** - Mentor profiles and information
- **mentor_requests** - Student mentor requests
- **quizzes** - Quiz definitions
- **quiz_questions** - Quiz questions
- **quiz_attempts** - Student quiz attempts

## API Endpoints

### Authentication
- `GET /` - Home page
- `GET /login` - Login page
- `POST /login` - Login user
- `GET /signup` - Signup page
- `POST /signup` - Register user
- `POST /logout` - Logout user

### Student Routes
- `GET /dashboard` - Student dashboard
- `GET /career-paths` - List career paths
- `POST /career-paths` - Create career path
- `GET /daily-topics` - Daily topics
- `GET /quizzes` - Available quizzes
- `POST /quiz/:id/attempt` - Take quiz
- `GET /ai-recommendations` - AI recommendations
- `GET /mentors` - Browse mentors

### Mentor Routes
- `GET /mentor/login` - Mentor login
- `GET /mentor/dashboard` - Mentor dashboard
- `GET /mentor/profile` - Mentor profile
- `GET /mentor/quizzes` - Manage quizzes
- `POST /mentor/quiz` - Create quiz

## Features in Detail

### AI-Powered Recommendations
The platform uses Google Gemini AI to provide personalized learning recommendations based on:
- User's learning history
- Current career path
- Completed milestones
- Quiz performance

### Quiz System
- Multiple choice questions
- Automatic grading
- Performance tracking
- Detailed results and analytics
- Mentor can create and manage quizzes

### Mentor System
- Students can request mentorship
- Mentors can accept/reject requests
- Track student progress
- Create custom quizzes for students

## Security

- **Row Level Security (RLS)**: Database-level security using Supabase RLS
- **Authentication**: Secure authentication with Supabase Auth
- **Session Management**: Server-side session management with Express Session
- **Input Validation**: All user inputs are validated
- **SQL Injection Protection**: Parameterized queries prevent SQL injection

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (default: 3001) | No |
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `GEMINI_API_KEY` | Google Gemini AI API key | Yes |
| `SESSION_SECRET` | Secret for session encryption | Yes |

## Troubleshooting

### Common Issues

**Issue: `ENOTFOUND` error for Supabase**
- Solution: Verify your `SUPABASE_URL` in the `.env` file
- Check your internet connection
- Ensure the Supabase project is active

**Issue: `punycode` deprecation warning**
- Solution: This is a warning from Node.js dependencies and doesn't affect functionality
- To suppress: Update dependencies or use `node --no-deprecation app.js`

**Issue: 404 for `/favicon.ico`**
- Solution: Add a `favicon.ico` file to the `public/` directory

**Issue: Session not persisting**
- Solution: Ensure `SESSION_SECRET` is set in `.env`

## Scripts

```bash
# Start the application
npm start

# Run with debugger
node --inspect app.js
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue on GitHub or contact the maintainers.

## Acknowledgments

- [Supabase](https://supabase.com/) for backend infrastructure
- [Google Gemini AI](https://ai.google.dev/) for AI capabilities
- [Express.js](https://expressjs.com/) for the web framework
- All contributors who have helped improve this project 
