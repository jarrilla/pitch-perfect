import axios from 'axios';
import { config } from '../config/env';

const WELLSAID_API_URL = 'https://api.wellsaidlabs.com/v1/tts/stream';

export async function TextToSpeech(text: string): Promise<Buffer> {
  try {
    const response = await axios({
      method: 'POST',
      url: WELLSAID_API_URL,
      headers: {
        'X-Api-Key': config.wellSaidApiKey,
        'Content-Type': 'application/json',
      },
      data: {
        text,
        speaker_id: '63',
      },
      responseType: 'arraybuffer',
    });

    return Buffer.from(response.data);
  } catch (error) {
    console.error('WellSaid TTS error:', error);
    throw error;
  }
}