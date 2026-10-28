import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

import config, { getEnvDiagnostics } from './config/env.js';
import connectDB, { getConnectionStatus } from './config/db.js';

import authRoutes from './routes/auth.routes.js';
import postRoutes from './routes/post.routes.js';
import adminRoutes from './routes/admin.routes.js';
import aiRoutes from './routes/ai.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import { notFound, errorHandler } from './middleware/error.middleware.js';

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Root / Welcome route
app.get('/', (req, res) => {
  res.send("Akatsuki's Draft API is running......");
});

// Safe Health Check endpoint (Requirement 9)
app.get('/api/health', async (req, res) => {
  let dbStatus = getConnectionStatus();

  // If not currently connected, attempt a connection
  if (dbStatus.readyState !== 1) {
    try {
      await connectDB();
      dbStatus = getConnectionStatus();
    } catch {
      dbStatus = getConnectionStatus();
    }
  }

  const isHealthy = dbStatus.readyState === 1;
  const envDiagnostics = getEnvDiagnostics();

  return res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: envDiagnostics.nodeEnv,
    database: {
      status: dbStatus.state,
      targetCluster: dbStatus.cluster,
    },
    services: {
      mongoConfigured: envDiagnostics.hasMongoUri,
      jwtConfigured: envDiagnostics.hasJwtSecret,
      cloudinaryConfigured: envDiagnostics.hasCloudinary,
      openRouterConfigured: envDiagnostics.hasOpenRouter,
    },
  });
});

// Middleware: Ensure database is connected before processing API requests
app.use(async (req, res, next) => {
  // Health and root routes already handled above
  try {
    await connectDB();
    next();
  } catch (err) {
    const errorDetails = err.message ? err.message.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@') : 'Database connection error';
    return res.status(500).json({
      success: false,
      message: `Database connection error: ${errorDetails}. Please verify MongoDB Atlas IP Access (0.0.0.0/0) and environment variables.`,
    });
  }
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/upload', uploadRoutes);

// Error handlers
app.use(notFound);
app.use(errorHandler);

// Start HTTP server only in long-running environments (skip in Vercel serverless)
if (!process.env.VERCEL) {
  const PORT = config.port || 5000;
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }).catch((err) => {
    console.error('[Server Startup] DB connection error:', err.message);
  });
}

export default app;
