import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";
import dotenv from "dotenv";
import { buildAvatarUrl, generateUniqueUsername } from "../utils/userIdentity.js";

dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase();
        const googleAvatar = profile.photos?.[0]?.value;

        let user = await User.findOne({ googleId: profile.id });
        if (user) {
          if (!user.username) {
            user.username = await generateUniqueUsername({
              name: user.name || profile.displayName,
              email: user.email || email,
            }, user._id);
          }
          if (!user.avatar) {
            user.avatar = googleAvatar || buildAvatarUrl(user.username || user.name || email);
          }
          await user.save();
          return done(null, user);
        }

        user = await User.findOne({ email });
        if (user) {
          user.googleId = profile.id;
          if (!user.username) {
            user.username = await generateUniqueUsername({
              name: user.name || profile.displayName,
              email,
            }, user._id);
          }
          user.avatar = user.avatar || googleAvatar || buildAvatarUrl(user.username || user.name || email);
          await user.save();
          return done(null, user);
        }

        const username = await generateUniqueUsername({
          name: profile.displayName,
          email,
        });

        user = await User.create({
          googleId: profile.id,
          name: profile.displayName,
          email,
          username,
          avatar: googleAvatar || buildAvatarUrl(username),
        });

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

export default passport;

