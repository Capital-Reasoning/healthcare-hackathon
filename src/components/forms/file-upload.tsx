'use client';

import { useCallback, useRef, useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onUpload: (file: File) => void;
  accept?: string;
  maxSizeMB?: number;
  isUploading?: boolean;
  progress?: number;
}

export function FileUpload({
  onUpload,
  accept = '.pdf,.docx,.txt,.md',
  maxSizeMB = 50,
  isUploading = false,
  progress,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndSelect = useCallback(
    (file: File) => {
      setError(null);

      const maxBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxBytes) {
        setError(`File too large. Maximum size is ${maxSizeMB}MB.`);
        return;
      }

      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      const accepted = accept.split(',').map((s) => s.trim().toLowerCase());
      if (!accepted.includes(ext)) {
        setError(`Unsupported file type. Accepted: ${accept}`);
        return;
      }

      setSelectedFile(file);
      onUpload(file);
    },
    [accept, maxSizeMB, onUpload],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) validateAndSelect(file);
    },
    [validateAndSelect],
  );

  const handleClick = () => inputRef.current?.click();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSelect(file);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-card px-6 py-8 transition-colors',
          isDragging
            ? 'border-primary bg-primary-tint'
            : 'border-border hover:border-primary/50 hover:bg-surface-warm',
          isUploading && 'pointer-events-none opacity-60',
        )}
      >
        <Upload className="size-8 text-text-muted" />
        <p className="text-sm font-medium text-text-secondary">
          Drop a file here or click to browse
        </p>
        <p className="text-xs text-text-muted">
          PDF, DOCX, TXT, MD — up to {maxSizeMB}MB
        </p>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />
      </div>

      {error && (
        <p className="text-xs font-medium text-red-600">{error}</p>
      )}

      {selectedFile && !error && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
          <FileText className="size-4 text-primary" />
          <span className="flex-1 truncate text-sm text-text-primary">
            {selectedFile.name}
          </span>
          <span className="text-xs text-text-muted">
            {(selectedFile.size / 1024 / 1024).toFixed(1)}MB
          </span>
          {!isUploading && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearFile();
              }}
              className="rounded p-0.5 text-text-muted hover:text-text-primary"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      )}

      {isUploading && progress !== undefined && (
        <div className="h-1.5 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      )}
    </div>
  );
}
