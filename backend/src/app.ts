import express from 'express'
import session from 'express-session'
import passport from 'passport'
import cors from 'cors'
import { config } from './config/env'
import logger from './config/logger'
import chatRoutes from './routes/chatRoutes'
import authRoutes from './auth/google'
import { connectDB } from './config/database'

const app = express()
app.set('trust proxy', 1);

// Connect to MongoDB
connectDB().catch(console.error)

// Basic middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// CORS configuration must come BEFORE session middleware
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// Session configuration before CORS
app.use(session({
  secret: process.env.SESSION_SECRET!,
  resave: true,
  saveUninitialized: false,
  name: 'sessionId',
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}))

// Passport middleware must come AFTER session middleware
app.use(passport.initialize())
app.use(passport.session())

// Routes
app.use('/auth', authRoutes)
app.use('/chat', chatRoutes)

app.get('/test-cookie', (req, res) => {
  res.cookie('test-cookie', 'hello', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  });
  res.json({ message: 'Cookie set!' });
});

app.listen(config.port, () => {
  logger.info(`Server running on port ${config.port}`)
})

export default app
