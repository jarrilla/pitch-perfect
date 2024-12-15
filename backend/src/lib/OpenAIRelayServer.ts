/**
 * OpenAI Realtime API Relay Server
 * 
 * This server is responsible for relaying messages between the client and the OpenAI Realtime API.
 * It uses the OpenAI Realtime API to send and receive messages.
 * 
 * Since we're using ExpressJS for other API functions, we bundle the express app here, as well.
 */

import { createServer, Server, IncomingMessage } from 'http';
import WebSocket from 'ws';
import { config } from '../config/env';
import logger from '../config/logger';
import { RealtimeClient } from '@openai/realtime-api-beta';

class OpenAIRelayServer {
  private apiKey: string;
  private wss: WebSocket.Server | null;
  private server: Server | null;

  constructor(app: Express.Application) {
    this.apiKey = config.openaiApiKey!;
    this.wss = null;
    this.server = createServer(app);
  }

  // Initialize the WebSocket server
  // Also start express server.listen
  public listen(port: number, callback: () => void) {
    this.wss = new WebSocket.Server({ server: this.server! });
    this.wss.on('connection', this.connectionHandler.bind(this));

    return this.server!.listen(port, callback);
  }

  private async connectionHandler(ws: WebSocket, req: IncomingMessage) {
    if (!req.url) {
      logger.error('No URL provided; closing connection.');
      ws.close();
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    if (pathname !== '/stream') {
      logger.error(`Invalid path: ${pathname}; closing connection.`);
      ws.close();
      return;
    }

    const client = new RealtimeClient({ apiKey: this.apiKey });

    // Forward OpenAI events to client
    client.realtime.on('server.*', (event: any) => {
      logger.info(`Relaying "${event.type}" to client.`);
      ws.send(JSON.stringify(event));
    });

    // Close socket if OpenAI closes connection & vice versa
    client.realtime.on('close', () => ws.close());
    ws.on('close', () => client.disconnect());

    const messageQueue: WebSocket.Data[] = [];
    const messageHandler = (data: WebSocket.Data) => {
      try {
        const event = JSON.parse(data as string);
        logger.info(`Relaying "${event.type}" to OpenAI.`);
        client.realtime.send(event.type, event);
      }
      catch (e) {
        logger.error(`Error parsing event from client: ${data}`, e);
      }
    };

    // Enqueue messages while still connecting
    ws.on('message', (data) => {
      if (!client.isConnected()) {
        messageQueue.push(data);
      }
      else {
        messageHandler(data);
      }
    });

    try {
      logger.info('Connecting to OpenAI...');
      await client.connect();
    }
    catch (e) {
      logger.error('Error connecting to OpenAI.', e);
      ws.close();
      return;
    }

    logger.info('Connected to OpenAI!');
    while (messageQueue.length > 0) {
      messageHandler(messageQueue.shift()!);
    }
  }
}

export default OpenAIRelayServer;
