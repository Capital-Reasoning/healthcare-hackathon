'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileUpload } from '@/components/forms/file-upload';
import { DocumentCard } from '@/components/data-display/document-card';

interface Document {
  id: string;
  title: string;
  filename: string | null;
  pageCount: number | null;
  tags: string[] | null;
  createdAt: string | null;
  metadata: Record<string, unknown> | null;
}

export function DocumentsSection() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch('/api/documents?pageSize=50');
      const json = await res.json();
      setDocuments(json.data ?? []);
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(10);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name.replace(/\.\w+$/, ''));

      // Simulate progress since fetch doesn't support progress natively
      const progressInterval = setInterval(() => {
        setUploadProgress((p) => Math.min(p + 5, 90));
      }, 1000);

      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (res.ok) {
        setUploadProgress(100);
        await fetchDocuments();
      } else {
        const json = await res.json();
        console.error('Upload failed:', json.error);
      }
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== id));
      }
    } catch {
      // silently fail
    }
  };

  const getStatus = (doc: Document): 'processing' | 'ready' | 'error' => {
    const meta = doc.metadata as Record<string, unknown> | null;
    const status = meta?.status as string | undefined;
    if (status === 'processing') return 'processing';
    if (status === 'error') return 'error';
    return 'ready';
  };

  const getChunkCount = (doc: Document): number | undefined => {
    const meta = doc.metadata as Record<string, unknown> | null;
    return meta?.chunkCount as number | undefined;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Document Library
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload clinical documents to build your searchable knowledge base. The
          AI agent can search and cite these documents.
        </p>
      </div>

      <FileUpload
        onUpload={handleUpload}
        isUploading={isUploading}
        progress={uploadProgress}
      />

      {isLoading ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Loading documents...
        </p>
      ) : documents.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No documents uploaded yet. Upload a PDF, DOCX, TXT, or MD file to get
          started.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {documents.map((doc) => (
            <DocumentCard
              key={doc.id}
              id={doc.id}
              title={doc.title}
              filename={doc.filename}
              pageCount={doc.pageCount}
              tags={doc.tags}
              createdAt={doc.createdAt}
              chunkCount={getChunkCount(doc)}
              status={getStatus(doc)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
