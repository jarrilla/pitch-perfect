import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { Router } from 'express'
import { User } from '../models/User'

declare module 'express-session' {
  interface SessionData {
    passport: any;
  }
}

const router = Router()

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: "/auth/google/callback"
  },
  async (_accessToken, _refreshToken, profile, done) => {
    try {
      // Find existing user
      let user = await User.findOne({ googleId: profile.id })

      if (!user) {
        // Create new user if doesn't exist
        user = await User.create({
          googleId: profile.id,
          email: profile.emails?.[0].value,
          displayName: profile.displayName,
        })
      } else {
        // Update last login time
        user.lastLogin = new Date()
        await user.save()
      }

      return done(null, user)
    } catch (error) {
      return done(error as Error)
    }
  }
))

// Update serialization to use MongoDB _id
passport.serializeUser((user: any, done) => {
  console.log("Serializing user:", {
    id: user._id,
    email: user.email,
    googleId: user.googleId
  });
  done(null, user._id);
})

passport.deserializeUser(async (id: string, done) => {
  console.log("Attempting to deserialize user with id:", id);
  try {
    const user = await User.findById(id);
    console.log("Deserialized user:", user ? {
      id: user._id,
      email: user.email,
      googleId: user.googleId
    } : 'User not found');
    done(null, user);
  } catch (error) {
    console.error("Deserialize error:", error);
    done(error);
  }
});

router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
)

router.get('/google/callback',
  (req, res, next) => {
    console.log('Starting authentication...');
    next();
  },
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL}/` }),
  (req, res) => {
    console.log('Authentication successful');
    console.log('Session before save:', {
      id: req.sessionID,
      passport: req.session?.passport,
      user: req.user
    });
    
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.redirect(`${process.env.FRONTEND_URL}/`);
      }
      console.log('Session saved successfully');
      console.log('Final session state:', {
        id: req.sessionID,
        passport: req.session?.passport,
        user: req.user
      });
      res.redirect(`${process.env.FRONTEND_URL}/chat`);
    });
  }
);

router.get('/check', (req, res) => {
  console.log("Session state during check:", {
    id: req.sessionID,
    passport: req.session?.passport,
    user: req.user
  });
  console.log("Is authenticated:", req.isAuthenticated());

  if (req.isAuthenticated()) {
    res.status(200).json({ authenticated: true });
  } else {
    res.status(401).json({ authenticated: false });
  }
});

router.get('/session-check', (req, res) => {
  res.json({
    sessionID: req.sessionID,
    session: req.session,
    user: req.user,
    isAuthenticated: req.isAuthenticated(),
    cookies: req.cookies
  });
});

router.post('/logout', (req, res) => {
  req.logout(() => {
    res.status(200).send()
  })
})

export default router 