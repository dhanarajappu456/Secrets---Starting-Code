//jshint esversion:6

require("dotenv").config();
const bodyParser = require("body-parser");
const express = require("express");
const mongoose = require("mongoose");
//const encryption = require("mongoose-encryption");
//const md5 = require("md5");
//const bcrypt = require("bcrypt");
//const saltRounds = 10;
const app = express();
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
const findOrCreate = require("mongoose-findorcreate");
app.use(
  session({
    secret: "little sectet",
    resave: false,
    saveUninitialized: false,
  })
);
//initialse the passport package
app.use(passport.initialize());
//
app.use(passport.session());

mongoose.connect("mongodb://127.0.0.1:27017/userDB");

const userSchema = new mongoose.Schema({
  email: String,
  username: String,
  googleId: String,
  secret: String,
});

//to hash and salt the password
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
//const secret  = process.env.SECRET;
//userSchema.plugin(encryption, { secret: secret, encryptedFields: ["pass"] });

const User = mongoose.model("user", userSchema);
passport.use(User.createStrategy());
//create the cookie

passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, {
      id: user.id,
      username: user.username,
      picture: user.picture,
    });
  });
});

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    function (accessToken, refreshToken, profile, cb) {
      User.findOrCreate(
        {
          googleId: profile.id,
          username: profile.displayName,
          email: profile.emails[0].value,
        },
        function (err, user) {
          console.log("ssjjk");
          return cb(err, user);
        }
      );
    }
  )
);
app.get("/", (req, res) => {
  res.render("home");
});
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/secrets", (req, res) => {
  // if (req.isAuthenticated()) {
  //   res.render("secrets");
  // } else {
  //   res.redirect("/login");
  // }

  User.find({ secret: { $ne: null } })
    .then((result) => {
      console.log(result);
      res.render("secrets", { userList: result });
    })
    .catch((err) => {
      console.log("error");
    });
});
app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      console.log("there is an error", err);
    }
    res.redirect("/");
  });
});
app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    res.redirect("/secrets");
  }
);
app.get("/submit", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});
app.post("/submit", (req, res) => {
  console.log("holll", req.user.id);
  const submittedSecret = req.body.secret;
  User.findByIdAndUpdate({ _id: req.user.id }, { secret: submittedSecret })
    .then((result) => {
      console.log("updated", result);
      res.redirect("/secrets");
    })
    .catch((err) => {
      console.log("error happend");
    });
});
app.post("/register", (req, res) => {
  // bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
  //   const newUser = new User({
  //     email: req.body.username,
  //     pass: hash,
  //   });
  //   newUser
  //     .save()
  //     .then((doc) => {
  //       console.log("success the save");
  //       res.render("secrets");
  //     })
  //     .catch((err) => {
  //       console.log("error", err);
  //     });
  // });
  // const newUser = new User({
  //   email: req.body.username,
  //   pass: md5(req.body.password),
  // });

  User.register(
    { username: req.body.username },
    req.body.password,
    (err, user) => {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, () => {
          res.redirect("/secrets");
        });
      }
    }
  );
});

app.post("/login", (req, res) => {
  // const userName = req.body.username;
  // const pass = req.body.password;
  // User.findOne({ email: userName })
  //   .then((foundUser) => {
  //     if (foundUser) {
  //       bcrypt.compare(pass, foundUser.pass, (err, result) => {
  //         if (result === true) {
  //           console.log("the succes");
  //           res.render("secrets");
  //         } else {
  //           res.write("<h1>error</h1>");
  //           res.send();
  //         }
  //       });
  //     } else {
  //       res.write("<h1>error</h1>");
  //       res.send();
  //     }
  //   })
  //   .catch((err) => {
  //     console.log("error", err);
  //   });

  const user = new User({
    username: req.body.username,
    pass: req.body.password,
  });

  req.login(user, (err) => {
    if (err) {
      console.log("errr", err);
    }
    //passport authenticate the given username and password, else it gives
    //unauthorised error
    else {
      passport.authenticate("local")(req, res, () => {
        res.redirect("/secrets");
      });
    }
  });
});
app.listen(3000, function () {
  console.log("server running on port  3000");
});
