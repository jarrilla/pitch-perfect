import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { Router } from 'express'
import { User } from '../models/User'

const router = Router()

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: "/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
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
  console.log("serializing user", user)
  done(null, user.id)
})

passport.deserializeUser(async (id: string, done) => {
  console.log("deserializing user", id)
  try {
    const user = await User.findById(id)
    done(null, user)
  } catch (error) {
    done(error)
  }
})

router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
)

router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: `${process.env.FRONTEND_URL}/`,
    successRedirect: `${process.env.FRONTEND_URL}/chat`
  })
)

router.get('/check', (req, res) => {

  console.log(req.isAuthenticated())

  if (req.isAuthenticated()) {
    res.status(200).json({ authenticated: true })
  } else {
    res.status(401).json({ authenticated: false })
  }
})

router.post('/logout', (req, res) => {
  req.logout(() => {
    res.status(200).send()
  })
})

export default router 