import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { ENV } from './config/env.js';
import path from 'path';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import citizenRoutes from './routes/citizenRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import communityRoutes from './routes/communityRoutes.js';
import geographyRoutes from './routes/geographyRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Security HTTP headers with strict, secure Content Security Policy
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", ENV.FRONTEND_URL, 'http://localhost:5173', 'https://*.googleapis.com', 'https://*.firebaseio.com'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https://images.unsplash.com', 'https://*.tile.openstreetmap.org'],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        fontSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration
app.use(
  cors({
    origin: [ENV.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);

// General request rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again after 15 minutes.',
    },
  },
});
app.use('/api', generalLimiter);

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for development uploads
app.use('/uploads', express.static(path.resolve(process.cwd(), 'public/uploads')));

// Health check and auth endpoints
app.use('/api', healthRoutes);
app.use('/api', authRoutes);
app.use('/api', citizenRoutes);
app.use('/api', publicRoutes);
app.use('/api', geographyRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/admin', adminRoutes);

// Root route
app.get('/', (_req, res) => {
  res.json({
    name: 'CivicResolve API',
    tagline: 'Your City. Your Voice. Your Resolve.',
    status: 'online',
    healthCheck: '/api/health',
  });
});

// Centralized error handling
app.use(errorHandler);

// Start server
const server = app.listen(ENV.PORT, () => {
  console.log(`[CivicResolve API] Running on http://localhost:${ENV.PORT}`);
  console.log(`[CivicResolve API] Health check at http://localhost:${ENV.PORT}/api/health`);
});

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`[CivicResolve API] Port ${ENV.PORT} already in use; attaching test client to running instance.`);
    return;
  }
  console.error('[CivicResolve API] Server startup error:', err);
});

process.on('uncaughtException', (err) => {
  console.error('[CivicResolve API] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[CivicResolve API] Unhandled Rejection:', reason);
});

process.on('exit', (code) => {
  console.log(`[CivicResolve API] Process exited with code: ${code}`);
});

export { app, server };
