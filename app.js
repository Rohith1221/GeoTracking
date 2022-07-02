const express = require("express");
const morgan = require("morgan");
const mongoose = require("mongoose");
const formidable = require("formidable");
const passport = require("passport");
const localStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const session = require("express-session");
const dotenv = require("dotenv");

const Issue = require("./models/isssue");
const User = require("./models/user");

const app = express();
dotenv.config();

const dbURL = process.env.dbURL;

mongoose
  .connect(dbURL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((result) => {
    console.log("connected to db");
    app.listen(3000, () => {
      console.log("listening on port 3000");
    });
  })
  .catch((error) => {
    console.log(error);
  }); //ascynch task

// register new engine
app.set("view engine", "ejs");

// middleware 3rd party
app.use(morgan("dev"));
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SECRET, //env.secret
    resave: false,
    saveUninitialized: true,
  })
);
app.use(express.json());

// passport js
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  // setup user model
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

passport.use(
  new localStrategy(function (username, password, done) {
    User.findOne({ username: username }, function (err, user) {
      if (err) {
        return done(err);
      }
      if (!user) {
        return done(null, false, { message: "User not found" });
      }
      bcrypt.compare(password, user.password, function (err, res) {
        if (err) return done(err);
        if (res == false)
          return done(null, false, { message: "Password mismatch" });
        return done(null, user);
      });
    });
  })
);

function isLoggedin(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/login");
}
function isLoggedout(req, res, next) {
  if (!req.isAuthenticated()) return next();
  res.redirect("/issues");
}

//routes
app.get("/", (req, res) => {
  res.render("home");
});

app.get("/issues/create", (req, res) => {
  res.render("issueCreate");
});

app.post("/issues/created", (req, res) => {
  console.log(req.body);
  // image upload
  // var form = new formidable.IncomingForm();
  // form.parse(req);
  // form.on("fileBegin", (name, file) => {
  //   file.path = __dirname + "/uploads/" + file.name;
  // });
  // form.on("file", (name, file) => {
  //   console.log("uploaded file: " + file.name);
  // });
  const issue = new Issue(req.body);
  issue
    .save()
    .then((result) => {
      res.render("issueCreated", { issue: result });
    })
    .catch((err) => {
      console.log("error: " + err.message);
    });
});

app.get("/issues", isLoggedin, (req, res) => {
  Issue.find()
    .sort({ createdAt: -1 })
    .then((result) => {
      res.render("issues", { title: "All Issues", issues: result });
    })
    .catch((error) => {
      console.log(error);
    });
});

app.get("/login", isLoggedout, (req, res) => {
  const response = { title: "Login", error: req.query.error };
  console.log(response);
  res.render("login", { response });
});

app.post(
  "/login",
  passport.authenticate("local", {
    // successRedirect: "/issues",
    failureRedirect: "/login?error=true",
  }),
  (req, res) => {
    Issue.find()
      .sort({ createdAt: -1 })
      .then((result) => {
        res.render("issues", {
          title: "All Issues",
          issues: result,
          admin: req.body.username,
        });
      })
      .catch((error) => {
        console.log(error);
      });
  }
);

app.get("/logout", function (req, res) {
  req.logout(() => console.log("logout"));
  res.redirect("/");
});

// Setup our admin user
app.get("/setup", async (req, res) => {
  const exists = await User.exists({ username: process.env.USER_NAME });

  if (exists) {
    console.log("exists");
    res.redirect("/login");
    return;
  }

  bcrypt.genSalt(10, function (err, salt) {
    if (err) return next(err);
    bcrypt.hash(process.env.PASSWORD, salt, function (err, hash) {
      if (err) return next(err);

      const newAdmin = new User({
        username: process.env.USER_NAME,
        password: hash,
      });

      newAdmin.save();

      res.redirect("/login");
    });
  });
});

app.use("/", (req, res) => {
  res.render("404");
});
