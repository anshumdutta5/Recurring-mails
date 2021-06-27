require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const request = require("request");
const https = require("https");
const nodemailer = require('nodemailer');
const cors = require('cors');
const schedule = require("node-schedule");

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

app.use(session({
  secret: process.env.TOKEN_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 1 * 60 * 60 * 1000
  }
}));


app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://admin-anshum:saket@123@cluster0-k7dse.mongodb.net/fliprDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
mongoose.set("useCreateIndex", true);

const fliprSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String
})

const jobSchema = new mongoose.Schema({
  name_job: String,
  name:String,
  subject: String
})

const historySchema = new mongoose.Schema({
  name_job: String,
  name:String,
  subject: String
})

var flag =0;

fliprSchema.plugin(passportLocalMongoose);
fliprSchema.plugin(findOrCreate);

const Flipr = new mongoose.model("Flipr", fliprSchema);
const Job = new mongoose.model("Job", jobSchema);
const History = new mongoose.model("History", jobSchema);

passport.use(Flipr.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  Flipr.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/mail-features",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {

    Flipr.findOrCreate({
      googleId: profile.id,
      email:profile.displayName
    }, function(err, user) {
      return cb(err, user);
    });
  }
));

app.get('/auth/google',
  passport.authenticate('google', {
    scope: ['profile']
  }));

app.get('/auth/google/mail-features',
  passport.authenticate('google', {
    failureRedirect: '/login'
  }),
  function(req, res) {
    res.redirect('/mail-features');
  });

app.get("/", function(req, res) {
  res.render("home");
})

app.get("/register", function(req, res) {
  res.render("register");
});

app.get("/login", function(req, res) {
  res.render("login");
});

app.get("/mail-features", function(req, res) {
  if (req.isAuthenticated()) {
    Flipr.find({
      "mail-features": {
        $ne: null
      }
    }, function(err, foundUsers) {
      if (err) {
        console.log(err);
      } else {
        if (foundUsers) {
          Job.find({}, function(err, results) {
            if (!err) {
              History.find({},function(err,results1){
                if(!err){
                  var f = 0;
                  if(flag === 1){
                    f=1;
                    flag = 0;
                  }
                  res.render("mail-features", {
                    existing_jobs: results,
                    history_jobs : results1,
                    flag :f
                  });
                }
              })

            }
          })

        }
      }
    });
  } else {
    res.redirect("/");
  }
})

app.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/");
})

app.post("/register", function(req, res) {
  Flipr.register({
    username: req.body.username
  }, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("mail-features");
      })
    }
  })
});

app.post("/login", function(req, res) {
  const user = new Flipr({
    username: req.body.username,
    password: req.body.password
  });
  req.login(user, function(err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("mail-features");
      });
    }
  })
});

app.post("/mail-features", function(req, res) {
  var emails = req.body.email;
  var cc_emails = req.body.email_cc;
  var subject = req.body.subject;
  var mail_body = req.body.mail_body;
  var clientPort = 465;
  var clientSmtp = 'smtp.gmail.com';
  var schedule_data = req.body.schedule;
  var delete_job = req.body.delete_job;
  var sec1 = req.body.sec;
  var time_m1 = req.body.time_m;
  var time_h1 = req.body.time_h;
  var day_m1 = req.body.day_m;
  var month1 = req.body.month;
  var day_w1 = req.body.day_w;
  if (req.isAuthenticated()) {
    if (delete_job != undefined) {


      var job = delete_job;
        Job.findOne({name_job:job},function(err,result){
          if(!err){
            console.log(result);
            var history_job = new History({
              name_job: result.name_job,
              name:result.name,
              subject: result.subject
            })
            history_job.save();
            Job.deleteOne({
              name_job: job
            }, function(err) {
              if (err) {
                console.log(err);
              } else {
                schedule.cancelJob(job);
                console.log("Successfully deleted data");
              }
            })
          }

        })



    }
    if (emails === undefined) {
      res.redirect("/mail-features")
    } else {
      var email_list = emails.split(",");
      var cc_email_list = cc_emails.split(",");
      var useSmtp = clientSmtp ? clientSmtp : 'smtp.gmail.com';
      var usePort = clientPort ? clientPort : 465;
      var message = "Hello welcome to my flipr mail <br /> <br />";
      const mailData = {
        from: "anshumdutta7@gmail.com", // sender address
        to: email_list, // list of receivers
        cc: cc_email_list,
        subject: subject,
        text: "Hello World!",
        html: mail_body
      };
      const transporter = nodemailer.createTransport({
        port: usePort, // true for 465, false for other ports
        host: useSmtp,
        auth: {
          user: "dymmyflipr@gmail.com",
          pass: "flipranshum@777",
        },
        secure: true,
      });

      var date_now = Date.now();
      var date = date_now.toString();
      var sec, day_w, day_m, time_h, time_s, time_m, month;
      var str;
      if(schedule_data === "none"){
        transporter.sendMail(mailData, function(err, info) {
          if (err) {
            console.log(err);
          } else {
            console.log("hi");
          }
        });
        var new_job = new History({
          name_job: "",
          name:"sent instantaneously",
          subject: subject
        })
        new_job.save();
        flag = 1;
        res.redirect("/mail-features");
      }else{


      switch (schedule_data) {
        case "recurring":
        if(sec1 === undefined){
          sec = "/10";
        }else{
          sec= "/"+sec1
        }
          day_w = "";
          day_m = "";
          time_h = "";
          time_m = "";
          time_s = "";
          month = "";
          str = "*" + sec + " *" + time_m + " *" + time_h + " *" + day_m + " *" + month + " *" + day_w;
          break;
        case "weekly":
        if(time_m1 === undefined)
          time_m = "42";
          else time_m = time_m1;
          if(time_h1 === undefined)
          time_h = "23";
          else time_h = time_h1;
          if(day_w1 === undefined)
          day_w = "SAT";
          else day_w = day_w1;
          sec = "";
          day_m = "";
          time_s = "";
          month = "";
          str = "0 " + time_m + " " + time_h + " * * " + day_w;
          break;
        case "monthly":
        if(time_m1 === undefined)
          time_m = "42";
          else time_m = time_m1;
          if(time_h1 === undefined)
          time_h = "23";
          else time_h = time_h1;
          if(day_m1 === undefined)
          day_m = "1";
          else day_m = day_m1;
          sec = "";
          day_w = "";
          time_s = "";
          month = "";
          str = "0 " + time_m + " " + time_h + " " + day_m + " * *";
          break;
        case "yearly":
        if(time_m1 === undefined)
          time_m = "42";
          else time_m = time_m1;
          if(time_h1 === undefined)
          time_h = "23";
          else time_h = time_h1;
          if(day_m1 === undefined)
          day_m = "1";
          else day_m = day_m1;
          if(month1 === undefined)
          month = "3";
          else month = month1;
          sec = "";
          day_w = "";
          time_s = "";
          str = "0 " + time_m + " " + time_h + " " + day_m + " " + month + " *";
          break;

      }

      //console.log(str);

      schedule.scheduleJob(date, str, function() {
        transporter.sendMail(mailData, function(err, info) {
          if (err) {
            console.log(err);
          } else {
            console.log("hi");
          }
        });
      })
      var new_job = new Job({
        name_job: date,
        name:str,
        subject: subject
      })
      new_job.save();
      flag = 1;
      res.redirect("/mail-features");
      }
    }
  } else {
    res.redirect("/login");
  }
})

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
})
