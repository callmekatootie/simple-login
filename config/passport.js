var LocalStrategy = require('passport-local').Strategy;
var fs = require('fs');
var path = require('path');
var config = require('config');

var userList = path.resolve(__dirname, config.get('USERS_FILE'));

var _getUserFromFile = function (username, callback) {
    fs.readFile(userList, 'utf8', function (err, data) {
        if (err) {
            console.error('Could not read list of users authorized to access this app.', err);
            return callback(err, null);
        }

        //Read the contents of the file
        try {
            users = JSON.parse(data);
        } catch (e) {
            console.error('Cannot read list of users authorized to access this app. Not a valid JSON file', err);
            return callback(err, null);
        }

        //Look for the user in the list of users authorized
        for (var i = 0; i < users.length; i++) {
            if (users[i].userName === username) {
                //Return immediately with user found
                return callback(null, users[i]);
            }
        }

        //No user found
        callback(null, {});
    });
};

var initializePassport = function (passport) {

    passport.use(new LocalStrategy(
        function (username, password, done) {
            _getUserFromFile(username, function (err, user) {
                if (!err) {
                    if (!user.userId) {
                        //User not found. For security reasons, do not let the end user know if their username is wrong or password
                        //Make it harder for an attacker to guess
                        return done(null, false, {
                            message: 'Incorrect username or password'
                        });
                    } else if (user.password !== password) {
                        //Correct user, Wrong password. For security reasons, do not let the end user know if their username is wrong or password
                        //Make it harder for an attacker to guess
                        return done(null, false, {
                            message: 'Incorrect username or password'
                        });
                    } else {
                        return done(null, user);
                    }
                } else {
                    return done(err);
                }
            });
        }
    ));

    passport.serializeUser(function (user, done) {
        done(null, JSON.stringify(user));
    });

    passport.deserializeUser(function (user, done) {
        done(null, JSON.parse(user));
    });
};

module.exports = initializePassport;
