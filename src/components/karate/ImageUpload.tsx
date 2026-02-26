'use client';

import { useCallback, useRef, useState } from 'react';
import {
  Upload,
  X,
  Camera,
  PenLine,
  AlertCircle,
  AlertTriangle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateImage, readFileAsDataUrl } from '@/lib/pdf/pdf-utils';

interface ImageUploadProps {
  type: 'photo' | 'signature';
  value?: string; // data URL
  onChange: (dataUrl: string | undefined) => void;
}

export default function ImageUpload({ type, value, onChange }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  const isPhoto = type === 'photo';
  const label = isPhoto ? 'Passport Photo' : 'Signature';
  const aspectLabel = isPhoto ? '3:4 portrait' : '3:1 landscape';
  const required = isPhoto;

  const handleFile = useCallback(
    async (file: File) => {
      setIsProcessing(true);
      setErrors([]);
      setWarnings([]);

      const result = await validateImage(file, type);

      setErrors(result.errors);
      setWarnings(result.warnings);
      if (result.dimensions) setDimensions(result.dimensions);

      if (result.valid) {
        const dataUrl = await readFileAsDataUrl(file);
        onChange(dataUrl);
      }

      setIsProcessing(false);
    },
    [type, onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      // Reset input so re-selecting same file works
      e.target.value = '';
    },
    [handleFile]
  );

  const handleRemove = useCallback(() => {
    onChange(undefined);
    setErrors([]);
    setWarnings([]);
    setDimensions(null);
  }, [onChange]);

  return (
    <div className="space-y-2">
      {/* Label */}
      <div className="flex items-center gap-2">
        {isPhoto ? (
          <Camera className="h-4 w-4 text-muted-foreground" />
        ) : (
          <PenLine className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="text-sm font-medium">
          {label}
          {required && <span className="ml-1 text-destructive">*</span>}
        </span>
        <span className="text-xs text-muted-foreground">({aspectLabel})</span>
      </div>

      {/* Upload area or preview */}
      {!value ? (
        <div
          className={cn(
            'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer',
            isDragOver
              ? 'border-accent bg-accent/10'
              : 'border-muted-foreground/25 hover:border-accent/50 hover:bg-accent/5',
            isPhoto ? 'aspect-[3/4] max-w-[200px]' : 'aspect-[3/1] max-w-[360px]'
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          {isProcessing ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground text-center">
                Click or drag to upload
              </p>
            </>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={handleInputChange}
          />
        </div>
      ) : (
        <div className="relative group">
          <div
            className={cn(
              'relative overflow-hidden rounded-lg border',
              isPhoto ? 'aspect-[3/4] max-w-[200px]' : 'aspect-[3/1] max-w-[360px]'
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt={label}
              className="h-full w-full object-cover"
            />
            {/* Hover overlay with remove */}
            <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                type="button"
                onClick={handleRemove}
                className="rounded-full bg-destructive p-2 text-destructive-foreground shadow-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          {/* Dimensions info */}
          {dimensions && (
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              {dimensions.width}×{dimensions.height}px
            </div>
          )}
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((err, i) => (
            <div
              key={i}
              className="flex items-start gap-1.5 text-xs text-destructive"
            >
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              <span>{err}</span>
            </div>
          ))}
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-1">
          {warnings.map((w, i) => (
            <div
              key={i}
              className="flex items-start gap-1.5 text-xs text-yellow-600 dark:text-yellow-400"
            >
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
