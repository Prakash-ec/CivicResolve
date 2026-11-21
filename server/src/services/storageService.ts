import fs from 'fs';
import path from 'path';
import { adminStorage, isFirebaseInitialized } from '../config/firebaseAdmin.js';
import { ENV } from '../config/env.js';

export interface StorageUploadResult {
  url: string;
  storageType: 'firebase_storage' | 'dev_local_storage';
  permanent: boolean;
  storagePath: string;
  warning?: string;
}

export interface IStorageService {
  uploadComplaintImage(
    buffer: Buffer,
    mimeType: string,
    ownerUid: string,
    originalFilename?: string
  ): Promise<StorageUploadResult>;
}

class StorageService implements IStorageService {
  private localUploadDir: string;

  constructor() {
    this.localUploadDir = path.resolve(process.cwd(), 'public/uploads/complaints');
  }

  async uploadComplaintImage(
    buffer: Buffer,
    mimeType: string,
    ownerUid: string,
    originalFilename: string = 'evidence.jpg'
  ): Promise<StorageUploadResult> {
    const timestamp = Date.now();
    const extension = mimeType.split('/')[1] || 'jpg';
    const cleanFilename = `${timestamp}_${Math.random().toString(36).substring(2, 8)}.${extension}`;
    const destinationPath = `complaints/${ownerUid}/${cleanFilename}`;

    // 1. Attempt Cloud Storage if initialized and bucket available
    if (adminStorage && isFirebaseInitialized) {
      try {
        const bucket = adminStorage.bucket();
        const file = bucket.file(destinationPath);

        await file.save(buffer, {
          metadata: {
            contentType: mimeType,
            metadata: {
              uploadedBy: ownerUid,
              purpose: 'civic_complaint_evidence',
            },
          },
        });

        // Generate signed URL or public URL if bucket is public
        // In Firebase Storage:
        const [url] = await file.getSignedUrl({
          action: 'read',
          expires: '03-01-2030',
        });

        return {
          url,
          storageType: 'firebase_storage',
          permanent: true,
          storagePath: destinationPath,
        };
      } catch (err: any) {
        console.warn(
          `[Storage] Firebase Storage bucket unavailable or billing restricted (${err.message}). Using local development upload mode.`
        );
      }
    }

    // 2. Development-Only Local File Storage Fallback (Zero-Cost / Spark plan safe)
    const userDir = path.join(this.localUploadDir, ownerUid);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    const localFilePath = path.join(userDir, cleanFilename);
    fs.writeFileSync(localFilePath, buffer);

    const relativePublicUrl = `/uploads/complaints/${ownerUid}/${cleanFilename}`;
    const fullDevUrl = `${ENV.FRONTEND_URL ? 'http://localhost:5000' : ''}${relativePublicUrl}`;

    return {
      url: fullDevUrl,
      storageType: 'dev_local_storage',
      permanent: false,
      storagePath: destinationPath,
      warning:
        'DEVELOPMENT ONLY: Image stored on local filesystem. Not durable for cloud deployment without Firebase Storage bucket provisioning.',
    };
  }
}

export const storageService = new StorageService();
