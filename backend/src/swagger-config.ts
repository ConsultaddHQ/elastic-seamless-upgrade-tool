import { Options} from 'swagger-jsdoc';

const swaggerOptions: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Documentation',
      version: '1.0.0',
      description: 'Documentation for the Node.js TypeScript API',
    },
    servers: [
      {
        url: 'http://localhost:3000', // Change as per your environment
        description: 'Local server',
      },
    ],
  },
  apis: ['./src/routes/**/*.ts'], // Path to your route files
};

export default swaggerOptions;
