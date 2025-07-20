const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const path = require("path");
const bcrypt = require("bcryptjs"); // For password encryption
const session = require("express-session"); // For session management
const app = express();

// Middleware setup
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Session configuration
app.use(
  session({
    secret: "your_secret_key", // Change this to a strong secret key
    resave: false,
    saveUninitialized: true,
  })
);

// MySQL connection setup
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "ramanu00",
  database: "learning_platform",
});

db.connect((err) => {
  if (err) throw err;
  console.log("MySQL Connected...");
});

// Route to serve main page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Route to serve login page
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// Route to serve register page
app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "register.html"));
});

// Route to serve dashboard page
app.get("/dashboard", (req, res) => {
  if (req.session.email) {
    res.sendFile(path.join(__dirname, "public", "dashboard.html"));
  } else {
    res.redirect("/login"); // Redirect to login if not authenticated
  }
});
// Route to serve Learning page
app.get("/learning", (req, res) => {
  if (req.session.email) {
    res.sendFile(path.join(__dirname, "public", "learning.html"));
  } else {
    res.redirect("/login");
  }
});

// Route to serve courses page
app.get("/courses", (req, res) => {
  if (req.session.email) {
    res.sendFile(path.join(__dirname, "public", "courses.html"));
  } else {
    res.redirect("/login");
  }
});

// Route to serve Workspace page
app.get("/workspace", (req, res) => {
  if (req.session.email) {
    res.sendFile(path.join(__dirname, "public", "workspace.html"));
  } else {
    res.redirect("/login");
  }
});

// Handle login logic
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const query = "SELECT * FROM users WHERE email = ?";
  db.query(query, [email], (err, results) => {
    if (err) throw err;

    if (results.length > 0) {
      const user = results[0];

      // Compare password with hashed password in database
      bcrypt.compare(password, user.password, (err, match) => {
        if (err) throw err;

        if (match) {
          req.session.email = user.email; // Store email in session
          res.redirect("/dashboard");
        } else {
          res.send("Invalid email or password.");
        }
      });
    } else {
      res.send("User not found.");
    }
  });
});

// Handle user registration logic
app.post("/register", (req, res) => {
  const { name, dob, place, mobile, age, gender, email, password } = req.body;

  // Hash the password before saving to the database
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      return res.status(500).send("Error hashing password.");
    }

    // SQL query to insert the new user
    const query = `INSERT INTO users (name, dob, place, mobile, age, gender, email, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    db.query(
      query,
      [name, dob, place, mobile, age, gender, email, hashedPassword],
      (err, results) => {
        if (err) {
          // Check if error is due to duplicate email or mobile number
          if (err.code === "ER_DUP_ENTRY") {
            return res
              .status(409)
              .send("Email or mobile number already exists.");
          }
          return res.status(500).send("Error registering user.");
        }
        res.send("Registration successful!");
      }
    );
  });
});

// Route to get user information based on email
app.get("/user/:email", (req, res) => {
  const email = req.params.email;

  const query =
    "SELECT name, dob, place, age, gender FROM users WHERE email = ?";
  db.query(query, [email], (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Database error." });
    }
    if (results.length > 0) {
      // Send the user's data as JSON
      res.json(results[0]);
    } else {
      res.status(404).json({ error: "User not found." });
    }
  });
});

app.get("/logout", (req, res) => {
  // Destroy the session
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.redirect("/dashboard"); // Redirect to dashboard on error
    }
    // Redirect to index.html after successful logout
    res.redirect("/"); // Assuming the index.html is served at the root
  });
});

// Start the server
const PORT = 3002;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
