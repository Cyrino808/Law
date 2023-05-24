const passport = require("passport");
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require("../Models/User_f");

      passport.use(new FacebookStrategy({
          clientID: process.env.FACEBOOK_ID,
          clientSecret: process.env.FACEBOOK_SECRET,
          callbackURL: "http://localhost:8000/auth/facebook/callback",
          passReqToCallback : true,
          profileFields: ['id', 'emails', 'name']
        },
        async (request, accessToken, refreshToken, profile, done) => {
          try {
              let existingUser = await User.findOne({ 'facebook.id': profile.id });
              // if user exists return the user</em> 
              if (existingUser) {
                return done(null, existingUser);
              }
              // if user does not exist create a new user</em> 
              console.log('Creating new user...');
              const newUser = new User({
                method: 'facebook',
                  facebook: {
                  id: profile.id,
                  name: profile.name.givenName + " " +  profile.name.familyName,
                  email: profile.emails[0].value
                }
              });
              await newUser.save();
              return done(null, newUser);
          } catch (error) {
              return done(error, false)
          }
        }
      ));
  
  module.exports = passport;