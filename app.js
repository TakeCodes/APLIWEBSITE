const express = require("express");
const app = express();
const path = require("path");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const bcrypt = require("bcrypt");
app.use(express.urlencoded({ extended: true }));
const User = require("./models/user");
require("dotenv").config(); 

// requiring mongoose
const mongoose = require("mongoose");

// Access template
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Access static files like (css, js, assets)
app.use(express.static(path.join(__dirname, "/public")));

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// ejs-mate For layououts
app.engine("ejs", ejsMate);

const dbUrl = process.env.ATLASDB;

async function main() {
  await mongoose.connect(dbUrl);
}

main()
  .then(() => {
    console.log("Connection successfull");
  })
  .catch((err) => {
    console.log("Error:", err);
  });

app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

// Middleware to check login
function isAuth(req, res, next) {
  if (req.session.userId) return next();
  res.redirect("/login");
}

// Routes
app.get("/home", (req, res) => {
  res.render("pages/home.ejs");
});


app.get('/domain', (req, res) => {
  res.render('index', { prediction: null });
});


app.post('/domain', async (req, res) => {
  const { Queried_Salary, Skill, No_of_Skills } = req.body;

  try {
      const response = await fetch('http://localhost:5000/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ Queried_Salary, Skill, No_of_Skills })
      });

      const data = await response.json();
      res.render('index', { prediction: data.prediction });
  } catch (error) {
      res.render('index', { prediction: "Error calling ML API" });
  }
});


// services
app.get("/services", (req, res) => {
  res.render("pages/services.ejs");
});


// contact
app.get("/contact", (req, res) => {
  res.render("pages/contact.ejs");
});


// about
app.get("/about", (req, res) => {
  res.render("pages/about.ejs");
});



app.get("/signup", (req, res) => res.render("user/signup"));
app.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const user = new User({ username, email, password: hash });
  await user.save();
  res.redirect("/login");
});

app.get("/login", (req, res) => res.render("user/login"));
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({
      $or: [{ username }, { email: username }],
    });

    // Check if user exists
    if (!user) {
      return res.send("Invalid username");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    // Check password
    if (!isMatch) {
      return res.send("Invalid password");
    }

    // Login success
    req.session.userId = user._id;
    res.redirect("/dashboard");
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).send("Something went wrong.");
  }
});

app.get("/dashboard", isAuth, async (req, res) => {
  const user = await User.findById(req.session.userId);
  res.render("pages/dashboard.ejs", {
    userEmail: user.email,
    userName: user.username,
  });
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/home");
  });
});



app.listen(8080, () => {
  console.log("Server is listening");
});
