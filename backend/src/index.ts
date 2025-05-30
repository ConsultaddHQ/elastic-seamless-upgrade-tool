import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';
import elasticRouter from './routes/elastic.router';

import logger from './logger/logger';
import { connectDB } from './databases/db';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
  res.send({
    message: 'Server is healthy! 🚀',
  });
});

export interface ElasticClusterBaseRequest {
  url: string;
  apiKey?: string;
  username?: string;
  password?: string;
  bearer?: string;
  ssl: object;
}
export interface ElasticClusterHealthRequest
  extends ElasticClusterBaseRequest {}

//routes
app.use('/api/elastic/clusters', elasticRouter);

connectDB().then(() => {
  app.listen(PORT, async () => {
    logger.info(`Server is running at http://localhost:${PORT}`);
  });
});
