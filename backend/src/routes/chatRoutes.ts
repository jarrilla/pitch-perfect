import { Router, Request, Response } from 'express';
import { ChatMessage } from '../services/openaiService';
import logger from '../config/logger';
import { generateStreamingResponse } from '../services/openaiService';

const router = Router();

router.get('/stream', async (req: Request, res: Response) => {
  try {
    const message = req.query.message as string;
    logger.info(`Received message: ${message}`);
    
    const messages: ChatMessage[] = [
      { role: 'user', content: message },
    ];

    const stream = await generateStreamingResponse(messages);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    res.write(`data: ${JSON.stringify({ content: '' })}\n\n`);

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
        // if (res.flush) res.flush();
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error) {
    logger.error('Streaming error:', error);
    res.status(500).json({ error: 'Streaming failed' });
  }
});

export default router;