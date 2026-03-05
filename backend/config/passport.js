import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config() ;

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
},
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;

      // Check if user already exists with this Google ID
      let user = await User.findOne({ googleId: profile.id });
      if (user) return done(null, user);

      // Step 2: check if user exists with this email (registered manually before)
      user = await User.findOne({ email });
      if (user) {
        user.googleId = profile.id;
        user.avatar = profile.photos[0].value;
        await user.save();
        return done(null, user);
      }

      // New user — create them from Google profile
      user = await User.create({
        googleId: profile.id,
        name: profile.displayName,
        email: profile.emails[0].value,
        avatar: profile.photos[0].value,
        // No password needed!
      });

      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

export default passport;
