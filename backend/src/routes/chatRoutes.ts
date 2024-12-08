import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { generateAIResponse } from '../services/openaiService';
import { sessionService } from '../services/sessionService';
import logger from '../config/logger';
import { TextToSpeech } from '../services/wellSaidService';

const router = Router();

const INITIAL_PROMPT = "I want to train you to respond like a specific person. Can you do that given a person's social media profiles?";
const CHALLENGE_PROMPT = `I want you to challenge my views so we can arrive at a solid conclusion.
My goal is to sell my idea to you.
Do not make it easy for me.
If anything I say is not convincing, make it harder for me.
If I say something you agree with, make it easier for me.`;

const formatProfileMessage = (link: string) => {
  return `Here is the twitter profile of the person I want you to emulate.
${link}

Let me know when you're ready to have a conversation`;
}

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
            'Content-Length': audioBuffer.length
        });
        res.send(audioBuffer);
    } catch (error) {
        logger.error('Error processing chat request', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.put('/', async (_req: Request, res: Response) => {
    try {
        const sessionId = uuidv4();
        logger.info('Starting new chat session', { sessionId });
        
        sessionService.createSession(sessionId);
        const aiResponse = await generateAIResponse([
            { role: 'user', content: INITIAL_PROMPT }
        ]);
        
        sessionService.addMessage(sessionId, { role: 'user', content: INITIAL_PROMPT });
        sessionService.addMessage(sessionId, { role: 'assistant', content: aiResponse! });

        logger.info('Chat session initialized', { sessionId });
        res.json({
            message: aiResponse,
            sessionId
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

router.post('/profile', async (req: Request, res: Response): Promise<void> => {
  try {
    const { link, sessionId } = req.body;
    logger.info('Received profile setup request', { sessionId });

    if (!sessionId || !link) {
      logger.error('Missing required fields', { sessionId, link });
      res.status(400).json({ error: 'Missing sessionId or link' });
      return
    }

    const message = formatProfileMessage(link);
    const aiResponse = await generateAIResponse([
      { role: 'user', content: message }
    ]);

    const message2 = CHALLENGE_PROMPT;
    const aiResponse2 = await generateAIResponse([
      { role: 'user', content: message2 }
    ]);

    // Add messages to session history
    sessionService.addMessage(sessionId, { role: 'user', content: message });
    sessionService.addMessage(sessionId, { role: 'assistant', content: aiResponse! });
    sessionService.addMessage(sessionId, { role: 'user', content: message2 });
    sessionService.addMessage(sessionId, { role: 'assistant', content: aiResponse2! });

    logger.info('Profile setup completed', { sessionId });
    res.json({ message: aiResponse });
  } catch (error) {
    logger.error('Error in profile setup', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;