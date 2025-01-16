import express, { Request, Response } from 'express';
import cors from 'cors';
import { ElasticClient } from './clients/elastic';
import { getClusterDetails, getDepriciationInfo, getNodesInfo, healthCheck } from './controllers/elasticController';
// import { generate } from './clients/geminiClient';
import elasticRouter from './routes/elasticRouter'
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import swaggerOptions from './swagger-config';

const app = express();
const PORT = 3000;


app.use(cors());
app.use(express.json());

// Swagger setup
const swaggerDocs = swaggerJSDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));


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
app.use('/api/elastic',elasticRouter)


// app.post('/api/elastic/health', healthCheck);
// app.post('/api/elastic/cluster',getClusterDetails)
// app.post('/api/elastic/nodes',getNodesInfo);
// app.post('/api/elastic/depriciationInfo',getDepriciationInfo);


app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});
