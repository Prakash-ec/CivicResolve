import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Robust environment resolution whether started from root (cwd) or server/ (cwd)
const possibleEnvPaths = [
  path.resolve(process.cwd(), 'server/.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../.env'),
  path.resolve(process.cwd(), '../server/.env'),
];

for (const envPath of possibleEnvPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}
dotenv.config();

export const ENV = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '',

  // Gemini AI configuration (Gemini 3.8 Flash is current generation)
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-3.8-flash',

  // Optional Groq API Key
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',

  // Firebase configuration
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || 'civicresolve-969d3',
  FIREBASE_SERVICE_ACCOUNT_PATH: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '',
  FIREBASE_SERVICE_ACCOUNT_KEY: process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '',
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || '',
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY || '',
};

export const isProduction = ENV.NODE_ENV === 'production';

/**
 * Returns a normalized, deduplicated list of allowed CORS origins.
 * Trims whitespace and strips any trailing slashes to guarantee exact origin matching.
 */
export function getAllowedOrigins(): string[] {
  const allowed = new Set<string>();

  // Always allow the deployed production frontend origin
  allowed.add('https://civicresolve-7j40.onrender.com');

  // Include development localhost origins in non-production environments
  if (!isProduction) {
    allowed.add('http://localhost:5173');
    allowed.add('http://127.0.0.1:5173');
    allowed.add('http://localhost:3000');
    allowed.add('http://127.0.0.1:3000');
    allowed.add('http://localhost:5000');
  }

  // Parse custom origins from CORS_ORIGIN or FRONTEND_URL (can be comma-separated)
  const envOrigins = [process.env.CORS_ORIGIN, process.env.FRONTEND_URL];
  for (const raw of envOrigins) {
    if (raw) {
      const parts = raw.split(',');
      for (const part of parts) {
        const cleaned = part.trim().replace(/\/+$/, '');
        if (cleaned) {
          allowed.add(cleaned);
        }
      }
    }
  }

  return Array.from(allowed);
}
