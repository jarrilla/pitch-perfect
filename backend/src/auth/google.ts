import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Router } from 'express';
import { User } from '../models/User';
import logger from '../config/logger';

// Use this to merge the User interface with the Express.User interface
declare global {
  namespace Express {
    interface User {
      _id: string
      email: string
      googleId: string
    }
  }
}

const router = Router();

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: '/auth/google/callback',
},
async (_accessToken, _refreshToken, profile, done) => {
  try {
    // Find existing user
    let user = await User.findOne({ googleId: profile.id });

    if (!user) {
      // Create new user if doesn't exist
      user = await User.create({
        googleId: profile.id,
        email: profile.emails?.[0].value,
        displayName: profile.displayName,
      });
    } else {
      // Update last login time
      user.lastLogin = new Date();
      await user.save();
    }

    return done(null, user as Express.User);
  } catch (error) {
    return done(error as Error);
  }
},
));

// Update serialization to use MongoDB _id
passport.serializeUser((user: Express.User, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user as Express.User);
  } catch (error) {
    logger.error('Deserialize error:', error);
    done(error);
  }
});

router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }),
);

router.get('/google/callback',
  passport.authenticate(
    'google',
    {
      failureRedirect: `${process.env.FRONTEND_URL}/`,
      successRedirect: `${process.env.FRONTEND_URL}/chat`,
    },
  ),
);

router.get('/check', (req, res) => {
  if (req.isAuthenticated()) {
    res.status(200).json({ authenticated: true });
  } else {
    res.status(401).json({ authenticated: false });
  }
});

router.post('/logout', (req, res) => {
  req.logout(() => {
    res.status(200).send();
  });
});

export default router; 