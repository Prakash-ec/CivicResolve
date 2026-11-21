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
  
  // Gemini AI configuration
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  
  // Optional Groq API Key
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  
  // Firebase configuration
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || 'civicresolve-969d3',
  FIREBASE_SERVICE_ACCOUNT_PATH: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '',
};

export const isProduction = ENV.NODE_ENV === 'production';
