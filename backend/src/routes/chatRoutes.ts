import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { generateAIResponse } from '../services/openaiService';
import { sessionService } from '../services/sessionService';
import logger from '../config/logger';
import { TextToSpeech } from '../services/wellSaidService';
import { GenerateInitialPrompt } from '../controllers/chatController';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const { message, sessionId } = req.body;
    logger.info('Received chat request', { message, sessionId });
        
    const currentSessionId = sessionId || uuidv4();
    if (!sessionId) {
      sessionService.createSession(currentSessionId);
    }

    sessionService.addMessage(currentSessionId, { role: 'user', content: message });
    const sessionMessages = sessionService.getSession(currentSessionId);
        
    const aiResponse = await generateAIResponse(sessionMessages || []);
    sessionService.addMessage(currentSessionId, { role: 'assistant', content: aiResponse! });

    // Generate speech and pipe directly to client
    const audioBuffer = await TextToSpeech(aiResponse!);
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
    });
    res.send(audioBuffer);
  } catch (error) {
    logger.error('Error processing chat request', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/', async (req: Request, res: Response) => {
  try {
    const { assistantMode } = req.body;
    if (!assistantMode) {
      res.status(400).json({ error: 'Assistant mode is required' });
      return;
    }

    const sessionId = uuidv4();
    logger.info('Starting new chat session', { sessionId });
        
    sessionService.createSession(sessionId);
    const initialPrompt = GenerateInitialPrompt(assistantMode);
    const aiResponse = await generateAIResponse([
      { role: 'system', content: initialPrompt },
    ]);
        
    sessionService.addMessage(sessionId, { role: 'system', content: initialPrompt });
    sessionService.addMessage(sessionId, { role: 'assistant', content: aiResponse! });

    logger.info('Chat session initialized', { sessionId });
    res.json({
      message: aiResponse,
      sessionId,
    });
  } catch (error) {
    logger.error('Error initializing chat session', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:sessionId', (req: Request, res: Response) => {
  const { sessionId } = req.params;
  logger.info('Ending chat session', { sessionId });
  sessionService.endSession(sessionId);
  res.json({ message: 'Session ended' });
});

export default router;