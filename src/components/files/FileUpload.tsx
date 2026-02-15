"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase, ProjectFile } from "@/lib/supabase";
import {
  Upload,
  File,
  FileText,
  Image,
  X,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface FileUploadProps {
  projectId: string;
  onUploadComplete?: (file: ProjectFile) => void;
}

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/markdown",
  "image/png",
  "image/jpeg",
  "image/gif",
];

const MAX_SIZE = 50 * 1024 * 1024; // 50MB

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return <Image className="w-5 h-5" />;
  if (mimeType.includes("pdf") || mimeType.includes("word") || mimeType.includes("document"))
    return <FileText className="w-5 h-5" />;
  return <File className="w-5 h-5" />;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUpload({ projectId, onUploadComplete }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const uploadFile = async (file: File) => {
    setError(null);
    setSuccess(null);

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(`File type ${file.type} not allowed. Allowed: PDF, Word, Excel, images, text.`);
      return;
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      setError(`File too large. Maximum size is ${formatFileSize(MAX_SIZE)}.`);
      return;
    }

    setUploading(true);

    try {
      // Generate unique file path
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filePath = `${projectId}/${timestamp}-${sanitizedName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("project-files")
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Create database record
      const { data: fileRecord, error: dbError } = await supabase
        .from("project_files")
        .insert({
          project_id: projectId,
          name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: "lex", // Can be changed to actual user
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setSuccess(`Uploaded ${file.name}`);
      onUploadComplete?.(fileRecord);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        uploadFile(files[0]);
      }
    },
    [projectId]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
    // Reset input
    e.target.value = "";
  };

  return (
    <div className="space-y-3">
      <Card
        className={`border-2 border-dashed transition-colors cursor-pointer ${
          isDragging
            ? "border-amber-500 bg-amber-500/5"
            : "border-zinc-700 bg-zinc-900/50 hover:border-zinc-600"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="p-6">
          <label className="flex flex-col items-center justify-center cursor-pointer">
            <input
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              accept={ALLOWED_TYPES.join(",")}
              disabled={uploading}
            />
            {uploading ? (
              <>
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-2" />
                <span className="text-sm text-zinc-400">Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 text-zinc-500 mb-2" />
                <span className="text-sm text-zinc-400">
                  Drop a file here or click to upload
                </span>
                <span className="text-xs text-zinc-600 mt-1">
                  PDF, Word, Excel, images, text (max 50MB)
                </span>
              </>
            )}
          </label>
        </CardContent>
      </Card>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-6 text-xs"
            onClick={() => setError(null)}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
          <Check className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}
    </div>
  );
}
