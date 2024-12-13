import { OpenAI } from 'openai';
import { config } from '../config/env';
import logger from '../config/logger';

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export const generateStreamingResponse = async (messages: ChatMessage[]) => {
  try {
    logger.info('Generating streaming AI response');
    const stream = await openai.chat.completions.create({
      messages,
      model: 'gpt-4o',
      stream: true,
    });

    return stream;
  } catch (error) {
    logger.error('Error generating AI response', { error });
    throw error;
  }
};
