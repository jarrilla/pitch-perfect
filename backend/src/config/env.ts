import dotenv from 'dotenv';

dotenv.config();

export const config = {
  wellSaidApiKey: process.env.WELLSAIDLABS_API_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY,
  port: process.env.PORT || 3000,
}; 