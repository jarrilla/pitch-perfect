import { ChatMessage } from './openaiService';
import logger from '../config/logger';

const sessions = new Map<string, ChatMessage[]>();

export const sessionService = {
  createSession: (sessionId: string) => {
    logger.info('Creating new session', { sessionId });
    sessions.set(sessionId, []);
    return sessionId;
  },

  addMessage: (sessionId: string, message: ChatMessage) => {
    logger.info('Adding message to session', { sessionId, message });
    const session = sessions.get(sessionId);
    if (session) {
      session.push(message);
      return session;
    }
    logger.warn('Session not found', { sessionId });
    return null;
  },

  getSession: (sessionId: string) => {
    logger.info('Retrieving session', { sessionId });
    return sessions.get(sessionId);
  },

  endSession: (sessionId: string) => {
    logger.info('Ending session', { sessionId });
    return sessions.delete(sessionId);
  },
}; 