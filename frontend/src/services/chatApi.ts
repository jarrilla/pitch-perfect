import { api } from './axios'

interface ChatResponse {
  message: string;
  sessionId: string;
}

export const chatApi = {
  async startSession(): Promise<ChatResponse> {
    const { data } = await api.put('/chat');
    return data;
  },

  async sendMessage(message: string, sessionId: string | null): Promise<ArrayBuffer> {
    const { data } = await api.post('/chat', 
      {
        message,
        sessionId
      },
      {
        responseType: 'arraybuffer'  // Important for receiving binary data
      }
    );
    return data;
  },

  async endSession(sessionId: string): Promise<void> {
    await api.delete(`/chat/${sessionId}`);
  },

  async setupProfile(link: string, sessionId: string): Promise<ChatResponse> {
    const { data } = await api.post('/chat/profile', {
      link,
      sessionId
    });
    
    return data;
  }
}; 