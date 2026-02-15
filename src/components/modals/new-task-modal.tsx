"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function NewTaskModal({ isOpen, onClose, onSuccess }: NewTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [category, setCategory] = useState("general");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, priority, category }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create task");
      }

      setTitle("");
      setDescription("");
      setPriority("medium");
      setCategory("general");
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl w-full max-w-md mx-4 p-6 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">New Task</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Title *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="bg-secondary border-border focus:border-border"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details..."
              className="bg-secondary border-border focus:border-border min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
                className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm focus:border-border focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm focus:border-border focus:outline-none"
              >
                <option value="general">General</option>
                <option value="development">Development</option>
                <option value="research">Research</option>
                <option value="design">Design</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-border hover:bg-secondary"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !title.trim()}
              className="flex-1 bg-accent hover:bg-accent/90 text-white"
            >
              {loading ? "Creating..." : "Create Task"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
