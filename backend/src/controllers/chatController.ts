import { Request, Response } from 'express';
import { generateAIResponse } from '../services/openaiService';

export const handleChatRequest = async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const reply = await generateAIResponse(prompt);
    res.json({ reply });
    
  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
}; 