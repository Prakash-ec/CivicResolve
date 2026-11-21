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
        storageBucket: `${ENV.FIREBASE_PROJECT_ID}.appspot.com`,
      });
      isFirebaseInitialized = true;
      console.log(`[Firebase Admin] Connected to Emulator for project: ${ENV.FIREBASE_PROJECT_ID}`);
    } else {
      let credential: any;
      if (ENV.FIREBASE_SERVICE_ACCOUNT_PATH) {
        const saPath = path.resolve(process.cwd(), ENV.FIREBASE_SERVICE_ACCOUNT_PATH);
        if (fs.existsSync(saPath)) {
          const sa = JSON.parse(fs.readFileSync(saPath, 'utf8'));
          credential = admin.credential.cert(sa);
        }
      }

      if (!credential) {
        try {
          credential = admin.credential.applicationDefault();
        } catch {
          // Deferred / unauthenticated local mode
        }
      }

      admin.initializeApp({
        credential,
        projectId: ENV.FIREBASE_PROJECT_ID,
        storageBucket: `${ENV.FIREBASE_PROJECT_ID}.appspot.com`,
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
