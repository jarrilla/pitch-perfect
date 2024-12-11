import dotenv from 'dotenv';

dotenv.config();

if (!process.env.FRONTEND_URL) {
  throw new Error('FRONTEND_URL environment variable is not set');
}

export const config = {
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  sessionSecret: process.env.SESSION_SECRET,
  wellSaidApiKey: process.env.WELLSAIDLABS_API_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY,
  port: process.env.PORT || 3000,
  frontendUrl: process.env.FRONTEND_URL,
}; 