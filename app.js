//jshint esversion:6

require("dotenv").config();
const bodyParser = require("body-parser");
const express = require("express");
const mongoose = require("mongoose");
const encryption = require("mongoose-encryption");
const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
mongoose.connect("mongodb://127.0.0.1:27017/userDB");

const userSchema = new mongoose.Schema({
  email: String,
  pass: String,
});


const secret  = process.env.SECRET;
userSchema.plugin(encryption, { secret: secret, encryptedFields: ["pass"] });

const User = mongoose.model("user", userSchema);
app.get("/", (req, res) => {
  res.render("home");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  const newUser = new User({
    email: req.body.username,
    pass: req.body.password,
  });

  newUser
    .save()
    .then((doc) => {
      console.log("sucess the save");
      res.render("secrets");
    })
    .catch((err) => {
      console.log("error", err);
    });
});

app.post("/login", (req, res) => {
  const userName = req.body.username;
  const pass = req.body.password;

  User.findOne({ email: userName })
    .then((foundUser) => {
      if (foundUser) {
        if (foundUser.pass == pass) {
          console.log("the succes");
          res.render("secrets");
        } else {
          res.write("<h1>error</h1>");
          res.send();
        }
      }
    })
    .catch((err) => {
      console.log("error", err);
    });
});
app.listen(3000, function () {
  console.log("server running on port  3000");
});
