"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase, ProjectFile } from "@/lib/supabase";
import {
  File,
  FileText,
  Image,
  Download,
  Trash2,
  MoreHorizontal,
  ExternalLink,
  Clock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FileListProps {
  files: ProjectFile[];
  onDelete?: (fileId: string) => void;
}

function getFileIcon(mimeType: string | null) {
  if (!mimeType) return <File className="w-5 h-5" />;
  if (mimeType.startsWith("image/")) return <Image className="w-5 h-5 text-purple-400" />;
  if (mimeType.includes("pdf")) return <FileText className="w-5 h-5 text-red-400" />;
  if (mimeType.includes("word") || mimeType.includes("document"))
    return <FileText className="w-5 h-5 text-blue-400" />;
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet"))
    return <FileText className="w-5 h-5 text-green-400" />;
  return <File className="w-5 h-5 text-muted-foreground" />;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getFileExtension(name: string): string {
  const parts = name.split(".");
  return parts.length > 1 ? parts.pop()?.toUpperCase() || "" : "";
}

export function FileList({ files, onDelete }: FileListProps) {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDownload = async (file: ProjectFile) => {
    setDownloading(file.id);
    try {
      const { data, error } = await supabase.storage
        .from("project-files")
        .download(file.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
    } finally {
      setDownloading(null);
    }
  };

  const handleDelete = async (file: ProjectFile) => {
    if (!confirm(`Delete "${file.name}"? This cannot be undone.`)) return;

    setDeleting(file.id);
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("project-files")
        .remove([file.file_path]);

      if (storageError) throw storageError;

      // Delete database record
      const { error: dbError } = await supabase
        .from("project_files")
        .delete()
        .eq("id", file.id);

      if (dbError) throw dbError;

      onDelete?.(file.id);
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setDeleting(null);
    }
  };

  const handleOpen = async (file: ProjectFile) => {
    try {
      const { data, error } = await supabase.storage
        .from("project-files")
        .createSignedUrl(file.file_path, 60 * 60); // 1 hour

      if (error) throw error;

      window.open(data.signedUrl, "_blank");
    } catch (err) {
      console.error("Open error:", err);
    }
  };

  if (files.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <File className="w-10 h-10 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No files yet</p>
        <p className="text-xs mt-1">Upload files to attach them to this project</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {files.map((file) => (
        <div
          key={file.id}
          className="flex items-center gap-3 p-3 bg-secondary rounded-lg border border-border/50 hover:border-border transition-colors group"
        >
          <div className="flex-shrink-0">{getFileIcon(file.mime_type)}</div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate">{file.name}</span>
              <Badge variant="outline" className="text-[10px] border-border px-1.5">
                {getFileExtension(file.name)}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
              <span>{formatFileSize(file.file_size)}</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(file.created_at)}
              </span>
              {file.uploaded_by && <span>by {file.uploaded_by}</span>}
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => handleOpen(file)}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => handleDownload(file)}
              disabled={downloading === file.id}
            >
              <Download className={`w-4 h-4 ${downloading === file.id ? "animate-pulse" : ""}`} />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-border">
                <DropdownMenuItem
                  className="text-red-400 focus:text-red-400 focus:bg-red-500/10"
                  onClick={() => handleDelete(file)}
                  disabled={deleting === file.id}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}
    </div>
  );
}
