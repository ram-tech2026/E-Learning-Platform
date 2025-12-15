# Learning Website

A modern, responsive web application for tracking and managing your learning journey. Built with Node.js, Express, EJS, and Supabase.

## Features

- **User Authentication**: Secure signup, login, and logout functionality
- **Learning Paths**: Create and manage personalized learning paths
- **Milestones**: Break down learning goals into achievable milestones
- **Daily Topics**: Track daily learning activities
- **AI Recommendations**: Get personalized learning recommendations
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Black & White Theme**: Clean, modern UI with smooth animations

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript, EJS templates
- **Backend**: Node.js, Express
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Styling**: Custom CSS with animations
- **Icons**: Font Awesome

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/learning-website.git
   cd learning-website
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=3000
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Set up the database:
   - Create a new project in Supabase
   - Run the SQL scripts in the `db` folder to create tables and set permissions

5. Start the server:
   ```
   npm start
   ```

6. Open your browser and navigate to `http://localhost:3000`

## Database Setup

The application requires the following tables in your Supabase database:

- `profiles`: User profile information
- `career_paths`: Learning paths created by users
- `career_milestones`: Milestones for each learning path
- `daily_topics`: Daily learning activities

Run the SQL scripts in the `db` folder to create these tables and set up the necessary permissions.

## Project Structure

```
learning-website/
├── controllers/       # Route controllers
├── db/                # Database scripts
├── models/            # Data models
├── public/            # Static assets
│   ├── css/           # Stylesheets
│   ├── js/            # Client-side JavaScript
│   └── images/        # Images
├── services/          # External services
├── views/             # EJS templates
├── app.js             # Main application file
├── package.json       # Project dependencies
└── README.md          # Project documentation
```

## Error Handling

The application includes robust error handling for:

- Database connection issues
- Authentication errors
- Invalid requests
- Not found pages

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 