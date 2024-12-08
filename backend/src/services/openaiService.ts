import removeMd from 'remove-markdown';
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

export const generateAIResponse = async (messages: ChatMessage[]) => {
  try {
    logger.info('Generating AI response', { messages });
    const completion = await openai.chat.completions.create({
      messages,
      model: "gpt-4o",
    });

    const response = completion.choices[0].message.content;
    return removeMd(response!);
  } catch (error) {
    logger.error('Error generating AI response', { error });
    throw error;
  }
};
