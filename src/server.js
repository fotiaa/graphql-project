import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { createServer } from 'http';
import express from 'express';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { PubSub } from 'graphql-subscriptions';
import cors from 'cors';
import depthLimit from 'graphql-depth-limit';
import { createRateLimitRule } from 'graphql-rate-limit';
import mongoose from 'mongoose';
import Redis from 'ioredis';
import dotenv from 'dotenv';

// Import our modules
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { createContext } from './context';
import { applyMiddleware } from 'graphql-middleware';

dotenv.config();

const rateLimitRule = createRateLimitRule({ identifyContext: (ctx) => ctx.id });

async function startServer() {
  const app = express();
  const httpServer = createServer(app);

  // Create WebSocket server
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  });

  const schema = makeExecutableSchema({ typeDefs, resolvers });
  const pubsub = new PubSub();

  // Set up WebSocket server
  const serverCleanup = useServer(
    {
      schema,
      context: (ctx) => {
        // WebSocket context setup
        return { ...ctx, pubsub };
      },
    },
    wsServer
  );

  const server = new ApolloServer({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
    validationRules: [depthLimit(7)],
  });

  await server.start();

  // Connect to MongoDB
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Create Redis client
  const redis = new Redis(process.env.REDIS_URL);

  app.use(
    '/graphql',
    cors(),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => createContext({ req, redis, pubsub }),
    })
  );

  const PORT = process.env.PORT || 4000;
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
    console.log(`🚀 Subscriptions ready at ws://localhost:${PORT}/graphql`);
  });
}

startServer().catch((err) => {
  console.error('Error starting server:', err);
});

export default startServer;