import express from 'express';
import session from 'express-session';
import passport from 'passport';
import cors from 'cors';
import { config } from './config/env';
import logger from './config/logger';
import chatRoutes from './routes/chatRoutes';
import authRoutes from './auth/google';
import { connectDB } from './config/database';
import OpenAIRelayServer from './lib/OpenAIRelayServer';

const app = express();


// Connect to MongoDB
connectDB().catch((err) => logger.error('MongoDB connection error:', err));

// Scaffold express app
app.set('trust proxy', 1);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET!,
  resave: true,
  saveUninitialized: false,
  name: 'ppauth',
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

// Passport middleware must come AFTER session middleware
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/auth', authRoutes);
app.use('/chat', chatRoutes);

// Relay server for OpenAI Realtime API & Express app
const port = Number(config.port);
const openAiRelayServer = new OpenAIRelayServer(app);
openAiRelayServer.listen(
  port,
  () => logger.info(`Server listening on port ${port}`)
);

export default app;
