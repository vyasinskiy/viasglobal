import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { wordRoutes } from './routes/words';
import { answerRoutes } from './routes/answers';
import { languageRoutes } from './routes/languages';

dotenv.config();

const app = express();
const prisma = new PrismaClient({
  log: ['error', 'warn', 'info', 'query'],
});
const PORT = process.env.BACKEND_PORT;

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/words', wordRoutes);
app.use('/api/answers', answerRoutes);
app.use('/api/languages', languageRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

/**
 * Static files in production
 */
if (process.env.NODE_ENV === 'production') {
  const STATIC_DIR = path.resolve(process.cwd(), 'client');

  app.use(express.static(STATIC_DIR, {
    index: false,
    maxAge: '1d',
    etag: true
  }));

  // SPA fallback — всё, что не /api/*, уходит на index.html
  app.get(/^\/(?!api)(.*)/, (req, res) => {
    res.sendFile(path.join(STATIC_DIR, 'index.html'));
  });
}

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

async function seedLanguages() {
  const defaultLanguages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
  ];

  for (const lang of defaultLanguages) {
    await prisma.language.upsert({
      where: { code: lang.code },
      update: {},
      create: lang,
    });
  }
}

async function startServer() {
  try {
    console.log('Starting server...');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    console.log('Initiating database connection...');
    await prisma.$connect();
    console.log('Prisma connected to the database successfully');

    await seedLanguages();
    const languages = await prisma.language.findMany();
    console.log(`Languages available: ${languages.map(l => `${l.code} (${l.name})`).join(', ')}`);
  } catch (error) {
    console.error('Failed to connect to the database:', error);
    process.exit(1);
  }
}

startServer();

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export { prisma };
