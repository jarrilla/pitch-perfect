import express from 'express';
import cors from 'cors';
import chatRoutes from './routes/chatRoutes';
import { config } from './config/env';
import logger from './config/logger';

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'DELETE', 'PUT'],
  credentials: true
}));

app.use(express.json());

// Routes
app.use('/chat', chatRoutes);

app.listen(config.port, () => {
  logger.info(`Server running on port ${config.port}`);
});
