import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from './config/db.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/logger.js';
import Problem from './models/Problem.js';
import User from './models/User.js';
import authRoutes from './routes/authRoutes.js';
import problemRoutes from './routes/problemRoutes.js';
import submissionRoutes from './routes/submissionRoutes.js';
import { seedDatabase } from './scripts/seedData.js';
import { resolvePythonExecutable } from './utils/judge.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 5000);

// Core middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL ? [process.env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'] : true,
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(requestLogger);

// Health check endpoint
app.get('/api/health', async (_req, res) => {
  const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const pythonBin = await resolvePythonExecutable();
  res.status(200).json({
    success: true,
    status: 'ok',
    service: 'evalengine-server',
    database: dbStates[mongoose.connection.readyState] || 'unknown',
    runtimes: {
      javascript: process.version,
      python: pythonBin,
    },
    timestamp: new Date().toISOString(),
  });
});

// REST API routes
app.use('/api/auth', authRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/submissions', submissionRoutes);

// 404 & global 4-parameter error handler
app.use(notFoundHandler);
app.use(errorHandler);

let httpServer = null;

const startServer = async () => {
  const dbInfo = await connectDB();

  // Auto-seed on initial boot if database is missing seed users or problems
  const [userCount, problemCount] = await Promise.all([
    User.countDocuments(),
    Problem.countDocuments(),
  ]);
  if (userCount === 0 || problemCount === 0) {
    const summary = await seedDatabase();
    console.log(
      `[Bootstrap] Seeded initial instructor (${summary.instructor.email}), student (${summary.student.email}), and ${summary.problemsCount} problems (${dbInfo.mode} DB).`
    );
  }

  httpServer = app.listen(PORT, () => {
    console.log(`[Server] EvalEngine API listening on http://localhost:${PORT}`);
  });
};

const shutdown = async (signal) => {
  console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
  if (httpServer) {
    await new Promise((resolve) => httpServer.close(resolve));
  }
  await disconnectDB();
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});

export default app;
