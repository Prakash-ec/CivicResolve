import multer, { FileFilterCallback } from 'multer';
import { Request, Response, NextFunction } from 'express';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB hard limit

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

// Use memory storage for fast, safe processing and in-memory multimodal AI streaming
const memoryStorage = multer.memoryStorage();

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) {
  if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type (${file.mimetype}). Only JPEG, PNG, and WebP images up to 5 MB are allowed.`
      )
    );
  }
}

export const uploadSingleImage = multer({
  storage: memoryStorage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 1,
  },
  fileFilter,
}).single('image');

export function validateImageMagicBytes(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 12) return false;

  // JPEG: FF D8 FF
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (isJpeg) return true;

  // PNG: 89 50 4E 47 (0x89, 'P', 'N', 'G')
  const isPng =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47;
  if (isPng) return true;

  // WebP: 'RIFF' at offset 0 and 'WEBP' at offset 8
  const isRiff = buffer.subarray(0, 4).toString('ascii') === 'RIFF';
  const isWebp = buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  if (isRiff && isWebp) return true;

  return false;
}

// Wrapper middleware to intercept, format Multer errors, and verify magic bytes
export function handleImageUpload(req: Request, res: Response, next: NextFunction) {
  uploadSingleImage(req, res, (err: any) => {
    if (!err) {
      if (req.file && req.file.buffer) {
        if (!validateImageMagicBytes(req.file.buffer)) {
          return res.status(400).json({
            error: {
              code: 'INVALID_FILE_SIGNATURE',
              message:
                'File binary signature does not match declared image type. Only authentic JPEG, PNG, and WebP files are accepted.',
              fieldErrors: { image: 'Corrupted or spoofed image binary detected.' },
            },
          });
        }
      }
      return next();
    }

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: {
            code: 'FILE_TOO_LARGE',
            message: 'Image size exceeds the 5 MB maximum limit.',
            fieldErrors: { image: 'Maximum file size allowed is 5 MB.' },
          },
        });
      }
      return res.status(400).json({
        error: {
          code: 'UPLOAD_ERROR',
          message: err.message,
          fieldErrors: { image: err.message },
        },
      });
    }

    return res.status(400).json({
      error: {
        code: 'INVALID_FILE_TYPE',
        message: err.message || 'Invalid upload.',
        fieldErrors: { image: err.message },
      },
    });
  });
}
