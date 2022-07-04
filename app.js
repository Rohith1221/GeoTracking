const express = require("express");
const morgan = require("morgan");
const mongoose = require("mongoose");
const formidable = require("formidable");
const passport = require("passport");
const localStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const session = require("express-session");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");

const Issue = require("./models/isssue");
const User = require("./models/user");
// const { countDocuments } = require("./models/isssue");

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
      const output = `<p> Thank you ${req.body.uname} for bringing the isuue to our notice , we have started to work on it</p>
  <p>Regards</p>
  <p>Manager</p>
  <p>Department of Safety and Management</p>
  `;

      // create reusable transporter object using the default SMTP transport
      let transporter = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: "codeinout@gmail.com", // generated ethereal user
          pass: "gsuoxyuydycslgmw", // generated ethereal password
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      // setup email data with unicode symbols
      let mailOptions = {
        from: '"New Issue Registered" <codeinout@gmail.com>', // sender address
        to: `${req.body.mail}`, // list of receivers
        subject: "Work in Progress", // Subject line
        text: "Hello world?", // plain text body
        html: output, // html body
      };
      // send mail with defined transport object
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          return console.log(error);
        }
        console.log("Message sent: %s", info.messageId);
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

        res.render("issueCreated", { issue: result });
        // res.render('contact', {msg:'Email has been sent'});
      });
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

app.get("/issues/:id", isLoggedin, (req, res) => {
  Issue.findById(req.params.id)
    .then((result) => {
      console.log(result);
      res.render("issueDetails", {
        title: "All Issues",
        issue: result,
      });
    })
    .catch((error) => {
      console.log(error);
    });
});
app.post("/issues/:id", isLoggedin, (req, res) => {
  console.log("ISSUE ID", req.body);
  const id = req.params.id;
  const output = `<p> You have a new complaint to work on</p>
  <h3>Details</h3>
  <ul>
  <li>Complaint registered by :${req.body.uname} </li>
  <li>User mail ID :${req.body.tomail} </li>
  <li>Complaint description:${req.body.comp_desc} </li>
  <li>Date of complaint registered:${req.body.date_registered} </li>
  <h3>Kindly revert with the progress of the issue </h3>
  </ul>
  `;

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: "codeinout@gmail.com", // generated ethereal user
      pass: "gsuoxyuydycslgmw", // generated ethereal password
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  // setup email data with unicode symbols
  let mailOptions = {
    from: '"New Issue Registered" <codeinout@gmail.com>', // sender address
    to: `${req.body.task_manager_mail}`, // list of receivers
    subject: "Complaint details", // Subject line
    text: "Hello world?", // plain text body
    html: output, // html body
  };
  // send mail with defined transport object
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log(error);
    }
    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

    Issue.findByIdAndUpdate(id, {
      taskmanger_mail_sent: true,
    }).then((result) => {
      res.redirect(`/issues/${id}`);
    });

    // res.redirect(`/issues/${req.params.id}`);
    // res.render('contact', {msg:'Email has been sent'});
  });
});

app.delete("/issues/:id", (req, res) => {
  const id = req.params.id;
  Issue.findByIdAndDelete(id)
    .then((result) => {
      res.json({ redirect: "/issues" });
    })
    .catch((e) => console.log(e));
});

app.post("/assign/:id", (req, res) => {
  const id = req.params.id;
  console.log(req.body);
  Issue.findByIdAndUpdate(id, {
    task_manger: `${req.body.taskmanager}`,
    task_manger_mail: `${req.body.taskmanagermail}`,
  }).then((result) => {
    res.redirect(`/issues/${id}`);
  });

  // Issue.findByIdAndUpdate(id , {})
  //   .then((result) => {
  //     res.json({ redirect: "/issues" });
  //   })
  //   .catch((e) => console.log(e));
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
