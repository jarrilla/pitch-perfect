import { api } from './axios';

interface ChatResponse {
  message: string;
  sessionId: string;
}

export const chatApi = {
  async startSession(assistantMode: 'sales' | 'investor' | 'coach'): Promise<ChatResponse> {
    const { data } = await api.put('/chat', { assistantMode });
    return data;
  },

  async sendMessage(message: string, sessionId: string | null): Promise<ArrayBuffer> {
    const { data } = await api.post('/chat', 
      {
        message,
        sessionId,
      },
      {
        responseType: 'arraybuffer',  // Important for receiving binary data
      },
    );
    return data;
  },

  async endSession(sessionId: string): Promise<void> {
    await api.delete(`/chat/${sessionId}`);
  },

  async setupProfile(link: string, sessionId: string): Promise<ChatResponse> {
    const { data } = await api.post('/chat/profile', {
      link,
      sessionId,
    });
    
    return data;
  },

  streamMessage(message: string) {
    return new EventSource(`${import.meta.env.VITE_API_BASE_URL}/chat/stream?message=${encodeURIComponent(message)}`);
  },
}; 