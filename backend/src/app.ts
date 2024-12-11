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

// Connect to MongoDB
connectDB().catch(console.error)

// Basic middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Session configuration before CORS
app.use(session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}))

// CORS configuration
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'OPTIONS']
}))

// Passport middleware
app.use(passport.initialize())
app.use(passport.session())

// Routes
app.use('/auth', authRoutes)
app.use('/chat', chatRoutes)

app.listen(config.port, () => {
  logger.info(`Server running on port ${config.port}`)
})

export default app
