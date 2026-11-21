import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { ENV } from './env.js';

let isFirebaseInitialized = false;

try {
  if (admin.apps.length === 0) {
    if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
      // Local emulator execution mode (no ADC needed)
      admin.initializeApp({
        projectId: ENV.FIREBASE_PROJECT_ID,
        storageBucket: `${ENV.FIREBASE_PROJECT_ID}.firebasestorage.app`,
      });
      isFirebaseInitialized = true;
      console.log(`[Firebase Admin] Connected to Emulator for project: ${ENV.FIREBASE_PROJECT_ID}`);
    } else {
      let credential: any;

      // 1. Direct JSON service account string from environment variable (ideal for Render)
      if (ENV.FIREBASE_SERVICE_ACCOUNT_KEY) {
        try {
          const sa = JSON.parse(ENV.FIREBASE_SERVICE_ACCOUNT_KEY);
          credential = admin.credential.cert(sa);
          console.log('[Firebase Admin] Loaded credentials from FIREBASE_SERVICE_ACCOUNT_KEY JSON string.');
        } catch (parseErr) {
          console.warn('[Firebase Admin] Warning: Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', (parseErr as Error).message);
        }
      }

      // 2. Separate Client Email & Private Key environment variables (Render standard)
      if (!credential && ENV.FIREBASE_CLIENT_EMAIL && ENV.FIREBASE_PRIVATE_KEY) {
        try {
          const cleanPrivateKey = ENV.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
          credential = admin.credential.cert({
            projectId: ENV.FIREBASE_PROJECT_ID,
            clientEmail: ENV.FIREBASE_CLIENT_EMAIL,
            privateKey: cleanPrivateKey,
          });
          console.log('[Firebase Admin] Loaded credentials from FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.');
        } catch (certErr) {
          console.warn('[Firebase Admin] Warning: Failed to load from FIREBASE_CLIENT_EMAIL/PRIVATE_KEY:', (certErr as Error).message);
        }
      }

      // 3. Service account JSON file path (e.g. local dev or Docker)
      if (!credential && ENV.FIREBASE_SERVICE_ACCOUNT_PATH) {
        const saPath = path.resolve(process.cwd(), ENV.FIREBASE_SERVICE_ACCOUNT_PATH);
        if (fs.existsSync(saPath)) {
          const sa = JSON.parse(fs.readFileSync(saPath, 'utf8'));
          credential = admin.credential.cert(sa);
          console.log(`[Firebase Admin] Loaded credentials from file: ${saPath}`);
        }
      }

      // 4. Google Application Default Credentials (GCP/GKE/Cloud Run environment)
      if (!credential) {
        try {
          credential = admin.credential.applicationDefault();
          console.log('[Firebase Admin] Using Application Default Credentials.');
        } catch {
          // Unauthenticated local/CI mode
        }
      }

      admin.initializeApp({
        credential,
        projectId: ENV.FIREBASE_PROJECT_ID,
        storageBucket: `${ENV.FIREBASE_PROJECT_ID}.firebasestorage.app`,
      });
      isFirebaseInitialized = true;
      console.log(`[Firebase Admin] Initialized successfully for project: ${ENV.FIREBASE_PROJECT_ID}`);
    }
  } else {
    isFirebaseInitialized = true;
  }
} catch (error) {
  console.warn(
    `[Firebase Admin] Notice: Firebase Admin not fully authenticated yet (${(error as Error).message}). Server running with fallback mock/deferred mode.`
  );
}

export const adminAuth = isFirebaseInitialized ? admin.auth() : null;
export const adminFirestore = isFirebaseInitialized ? admin.firestore() : null;
export const adminStorage = isFirebaseInitialized ? admin.storage() : null;
export { admin, isFirebaseInitialized };
