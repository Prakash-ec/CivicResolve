import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { ENV, getAllowedOrigins } from './config/env.js';
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

// Compute normalized list of allowed origins
const allowedOrigins = getAllowedOrigins();
console.log('[CivicResolve API] CORS allowed origins:', allowedOrigins);

// Security HTTP headers with strict, secure Content Security Policy
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", ...allowedOrigins, 'https://*.googleapis.com', 'https://*.firebaseio.com'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https://images.unsplash.com', 'https://*.tile.openstreetmap.org'],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        fontSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    xContentTypeOptions: true,
    xXssProtection: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Production-ready CORS configuration
const corsOptions: cors.CorsOptions = {
  origin: (requestOrigin, callback) => {
    // Allow non-browser requests (e.g. server health monitors, curl, backend-to-backend)
    if (!requestOrigin) {
      return callback(null, true);
    }
    const normalized = requestOrigin.trim().replace(/\/+$/, '');
    if (allowedOrigins.includes(normalized)) {
      return callback(null, true);
    }
    return callback(
      new Error(`CORS policy: Origin '${requestOrigin}' is not allowed by CivicResolve API allowlist.`)
    );
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Disposition'],
  credentials: false, // Token-based Bearer authentication (no cookies required)
  maxAge: 86400, // Cache preflight for 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

// CORS middleware MUST execute before all routes
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

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

// Dedicated authentication rate limiter (brute-force defense)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: {
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts. Please try again after 15 minutes.',
    },
  },
});
app.use('/api/auth', authLimiter);

// Dedicated AI endpoint rate limiter (quota draining defense)
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: {
    error: {
      code: 'AI_RATE_LIMIT_EXCEEDED',
      message: 'Too many AI requests. Please slow down and try again shortly.',
    },
  },
});
app.use('/api/ai', aiLimiter);
app.use('/api/complaints/ai', aiLimiter);

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for development uploads
app.use('/uploads', express.static(path.resolve(process.cwd(), 'public/uploads')));

// Health check and auth endpoints
app.use('/api', healthRoutes);
app.use('/api', authRoutes);
app.use('/api', publicRoutes); // Public grievance feed & statistics mounted BEFORE parameterized citizen routes
app.use('/api', citizenRoutes);
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

// Start server on 0.0.0.0 for containerized / Render production compatibility
const server = app.listen(ENV.PORT, '0.0.0.0', () => {
  console.log(`[CivicResolve API] Running on http://0.0.0.0:${ENV.PORT}`);
  console.log(`[CivicResolve API] Health check at http://0.0.0.0:${ENV.PORT}/api/health`);
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
