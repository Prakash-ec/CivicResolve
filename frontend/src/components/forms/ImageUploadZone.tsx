import React, { useState, useEffect, useRef } from 'react';
import { Camera, UploadCloud, X, AlertCircle, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { Button } from '../ui/Button.js';

interface ImageUploadZoneProps {
  onImageSelected: (file: File | null) => void;
  selectedFile: File | null;
}

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const ImageUploadZone: React.FC<ImageUploadZoneProps> = ({
  onImageSelected,
  selectedFile,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      setFileError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [selectedFile]);

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) return resolve(file);

      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };

      img.onload = () => {
        const maxDimension = 1280;
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(file);

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) {
              resolve(file);
            } else {
              const compressed = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressed);
            }
          },
          'image/jpeg',
          0.8
        );
      };

      img.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  };

  const handleFile = async (file: File) => {
    setFileError(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setFileError('Invalid file format. Please upload a JPEG, PNG, or WebP image.');
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      setFileError('File size exceeds the 5 MB limit. Please select a smaller photo.');
      return;
    }

    try {
      const optimizedFile = await compressImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
        onImageSelected(optimizedFile);
      };
      reader.readAsDataURL(optimizedFile);
    } catch {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
        onImageSelected(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    setFileError(null);
    onImageSelected(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleInputChange}
        className="hidden"
        id="evidence-upload-input"
      />

      {fileError && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-3 rounded-lg bg-red-50 border border-red-200 text-civic-critical text-xs flex items-start gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{fileError}</span>
        </div>
      )}

      {previewUrl && selectedFile ? (
        <div className="relative rounded-2xl border border-surface-border bg-white p-3 shadow-sm">
          <div className="relative h-60 w-full rounded-xl overflow-hidden bg-surface-subtle flex items-center justify-center">
            <img
              src={previewUrl}
              alt="Complaint evidence preview"
              className="h-full w-full object-contain"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors shadow-md"
              aria-label="Remove uploaded image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-civic-muted px-1">
            <div className="flex items-center gap-1.5 truncate max-w-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-brand-500 shrink-0" />
              <span className="font-medium text-civic-dark truncate">
                {selectedFile.name}
              </span>
              <span>({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              Replace Photo
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-surface-border hover:border-brand-400 bg-white hover:bg-brand-50/20 rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-colors duration-150 group"
        >
          <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-500 flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
            <Camera className="w-6 h-6 stroke-[2]" />
          </div>
          <h4 className="text-sm font-semibold text-civic-dark">
            Upload Evidence Photograph (Optional)
          </h4>
          <p className="text-xs text-civic-muted mt-1 max-w-sm mx-auto leading-relaxed">
            Drag and drop your photo here, or click to browse files. Supports JPEG, PNG, or WebP up to 5 MB.
          </p>
          <span className="inline-block mt-3 px-3 py-1 text-[11px] font-semibold text-brand-700 bg-brand-50 rounded-full border border-brand-200">
            Helps AI assess urgency and safety risks
          </span>
        </div>
      )}
    </div>
  );
};
