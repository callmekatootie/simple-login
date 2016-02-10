var express = require('express');
var config = require('config');
var passport = require('passport');
var session = require('express-session');
var bodyParser = require('body-parser');
var nunjucks = require('nunjucks');
var flash = require('flash');

//Initialize passport
require('./config/passport')(passport);

var app = express();
var port = config.get('PORT');

//Check if the user is logged in or not
var _isAuthenticated = function (req, res, next) {
    var unAuthenticatedUser = req.body || {
        username: '',
        password: ''
    };

    if (req.user) {
        if (req.url === '/' || req.url === '/login') {
            //Requesting for a url that allows the user to login
            //Redirect to landing page visible only after logged in
            res.redirect('/landing');
        } else {
            //User is logged in and is trying to access a page that requires them to be logged in.
            //Proceed to the next call in the stack - the actual path handler
            next();
        }
    } else {
        if (req.url !== '/login') {
            //User is not logged in. User is trying to access page for which they need to login
            //Ask the user to login
            res.redirect('/login');
        } else {
            //User is not logged in. User is asking to login. Show the login page
            res.render('not-logged-in.html');
        }
    }
}

//To parse the request body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

//To parse the session in the request - used by Passportjs too
app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: config.get('SESSION_SECRET')
}));

//Allow flash messages
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

//Configure Template Engine
nunjucks.configure('views', {
    autoescape: true,
    express: app
});

//Clear any old flash messages
app.get('/*', function(req,res,next) {
    req.session.flash = [];
    next();
});

//Route Handlers
app.get('/', _isAuthenticated);

app.get('/login', _isAuthenticated);

app.get('/landing', _isAuthenticated, function (req, res) {
    res.render('logged-in.html', {
        user: req.user
    });
});

//Login Handler
app.post('/login', passport.authenticate('local', {
    successRedirect: '/landing',
    failureRedirect: '/login',
    failureFlash: true
}));

//Logout Handler
app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
});

app.use(function (req, res) {
    res.status(404).json({error: "route not found"});
});

app.listen(port, function () {
    console.log('Trixel Landing Site app listening on port', port);
});
