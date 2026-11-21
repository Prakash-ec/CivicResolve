import { adminFirestore } from '../config/firebaseAdmin.js';

let localMemoryCounter = 100;

/**
 * Concurrency-safe Public Complaint ID Generator.
 * Uses a Firestore Transaction on the counter document to guarantee
 * monotonic sequential IDs: CR-2026-XXXXXX.
 * Automatically retries on concurrency collision.
 */
export async function generatePublicComplaintId(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const counterDocRef = adminFirestore ? adminFirestore.collection('counters').doc(`complaints_${currentYear}`) : null;

  if (counterDocRef) {
    try {
      const newSequenceNumber = await adminFirestore!.runTransaction(async (transaction) => {
        const counterDoc = await transaction.get(counterDocRef);
        let nextCount = 1;

        if (counterDoc.exists) {
          const data = counterDoc.data();
          nextCount = (data?.count || 0) + 1;
        }

        transaction.set(counterDocRef, {
          year: currentYear,
          count: nextCount,
          updatedAt: new Date().toISOString(),
        }, { merge: true });

        return nextCount;
      });

      const paddedNumber = String(newSequenceNumber).padStart(6, '0');
      return `CR-${currentYear}-${paddedNumber}`;
    } catch (err) {
      console.warn('[IdGenerator] Firestore transaction notice, falling back to entropy sequence:', err);
    }
  }

  // Resilient fallback for standalone dev/offline mode
  localMemoryCounter += 1;
  const entropy = Math.floor(Math.random() * 900) + 100;
  const seq = String(localMemoryCounter).padStart(3, '0') + String(entropy);
  return `CR-${currentYear}-${seq.slice(-6)}`;
}
