import dotenv from 'dotenv';

dotenv.config();

if (!process.env.FRONTEND_URL) {
  throw new Error('FRONTEND_URL environment variable is not set');
}

export const config = {
  wellSaidApiKey: process.env.WELLSAIDLABS_API_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY,
  port: process.env.PORT || 3000,
  frontendUrl: process.env.FRONTEND_URL,
}; 