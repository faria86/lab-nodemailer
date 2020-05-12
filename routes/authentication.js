const { Router } = require("express");
const router = new Router();

const User = require("./../models/user");
const bcryptjs = require("bcryptjs");

router.get("/", (req, res, next) => {
  res.render("index");
});

router.get("/sign-up", (req, res, next) => {
  res.render("sign-up");
});

router.post("/sign-up", (req, res, next) => {
  const { name, email, password } = req.body;
  const emailToken = (Math.random() * 100000).toString(); //this is not the best method for tokens; research afterwards
  let user;
  bcryptjs
    .hash(password, 10)
    .then((hash) => {
      return User.create({
        name,
        email,
        passwordHash: hash,
        confirmationCode: emailToken,
      });
    })
    .then((newUser) => {
      user = newUser;
      return transporter.sendMail({
        from: `LAB <${process.env.NODEMAILER_EMAIL}>`,
        to: email,
        subject: "Please Verify your email",
        html: `<a href="http://localhost:3000/auth/confirm/${emailToken}">Verify email</a>`,
      });
    })
    .then((result) => {
      req.session.user = user._id;
      res.redirect("/");
      console.log("Email was sent successfully.");
      console.log(result);
    })
    .catch((error) => {
      next(error);
    });
});

router.get("/auth/confirm/:emailToken", (req, res, next) => {
  //Confirming a user === changing the user from pending to active
  const emailToken = req.params.emailToken;
  User.findOneAndUpdate({ confirmationCode: emailToken }, { status: "Active" })
    .then(/*do some logic in here*/)
    .catch(/*do some logic in here*/);
});

router.get("/sign-in", (req, res, next) => {
  res.render("sign-in");
});

router.post("/sign-in", (req, res, next) => {
  let userId;
  const { email, password } = req.body;
  User.findOne({ email })
    .then((user) => {
      if (!user) {
        return Promise.reject(new Error("There's no user with that email."));
      } else {
        userId = user._id;
        return bcryptjs.compare(password, user.passwordHash);
      }
    })
    .then((result) => {
      if (result) {
        req.session.user = userId;
        res.redirect("/");
      } else {
        return Promise.reject(new Error("Wrong password."));
      }
    })
    .catch((error) => {
      next(error);
    });
});

router.post("/sign-out", (req, res, next) => {
  req.session.destroy();
  res.redirect("/");
});

const routeGuard = require("./../middleware/route-guard");

router.get("/private", routeGuard, (req, res, next) => {
  res.render("private");
});

const dotenv = require("dotenv");
dotenv.config();

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PASSWORD,
  },
});

transporter
  .sendMail({
    from: `LAB <${process.env.NODEMAILER_EMAIL}>`,
    to: "ih174test@gmail.com",
    subject: "Test email",
    html:
      '<a href="http://localhost:3000/auth/confirm/THE-CONFIRMATION-CODE-OF-THE-USER">Verify email</a>',
  })
  .then((result) => {
    console.log("Email was sent successfully.");
    console.log(result);
  })
  .catch((error) => {
    console.log("There was an error sending the email.");
    console.log(error);
  });

module.exports = router;
