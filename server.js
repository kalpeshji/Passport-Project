const express = require('express');
const app = express();
const fs = require('fs');
const colors = require('colors');

// Body Parser
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// View
app.set('view engine', 'ejs');

// Public
app.use(express.static('Public'));

// Multer
const multer = require('multer');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        return cb(null, './upload');
    },
    filename: (req, file, cb) => {
        return cb(null, Date.now() + file.originalname);
    }
});

const upload = multer({ storage: storage }).single('blogImage');
app.use(express.static('upload'));

// Mongoose
const mongoose = require("mongoose");
mongoose.connect('mongodb://localhost:27017/PassportKalpesh');
const { userModel } = require('./UserSchema.js');
const { blogModel } = require('./BlogSchema.js');

// Express Session
const session = require('express-session');
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
}));

// Passport.js
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password'
},
    async function (username, password, done) {
        const user = await userModel.findOne({ username: username });
        if (!user) {
            return done(null, false, { message: 'User not found!' });
        }
        if (user.password !== password) {
            return done(null, false, { message: 'Password is incorrect!' });
        }
        return done(null, user);
    }
));

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(async function (id, done) {
    const user = await userModel.findById(id);
    done(null, user);
});

app.use(passport.initialize());
app.use(passport.session());


// Routes
app.get('/', function (req, res) {
    if (req.isAuthenticated()) {
        return res.redirect("/blog");
    }
    res.render('Pages/SignUp');
});

app.post("/", async function (req, res) {
    const blogData = await userModel(req.body);
    const result = await blogData.save();
    if (result) {
        res.redirect('/login');
    }
});

app.get('/login', function (req, res) {
    if (req.isAuthenticated()) {
        return res.redirect('/blog');
    }
    res.render('Pages/Login');
});

app.post('/login', passport.authenticate('local', {
    successRedirect: '/blog',
    failureRedirect: '/login'
}));

app.post('/add', async function (req, res) {
    upload(req, res, async function () {
        if (req.file) {
            var details = {
                title: req.body.title,
                blogImage: req.file.filename,
                description: req.body.description,
                createdBy: req.user.username
            };
            const blog = await blogModel(details);
            const result = await blog.save();
            res.redirect("/blog");
        } else {
            console.log('Error');
        }
    });
});

app.get('/blog', async function (req, res) {
    if (req.isAuthenticated()) {
        try {
            const blogs = await blogModel.find({}).populate('createdBy').exec();
            res.render('Pages/Blog', { blog: blogs });
        } catch (error) {
            console.error(error);
            res.redirect('/login');
        }
    } else {
        res.redirect('/login');
    }
});


app.get('/addblog', function (req, res) {
    if (req.isAuthenticated()) {
        res.render('Pages/AddBlog');
    } else {
        res.redirect('/login');
    }
});

app.get('/logout', function (req, res) {
    req.logout(function (err) {
        if (err) {
            console.error(err);
        }
        res.redirect('/login');
    });
});

const PORT = 8000;

app.listen(PORT, () => {
    console.log(`Click here: http://localhost:${PORT}`.green.bold);
});