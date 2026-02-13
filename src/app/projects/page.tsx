"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase, Project } from "@/lib/supabase";
import {
  Plus,
  FolderKanban,
  MoreHorizontal,
  Loader2,
  AlertCircle,
} from "lucide-react";

const statusColors: Record<string, string> = {
  active: "bg-green-500/20 text-green-400",
  "on-hold": "bg-amber-500/20 text-amber-400",
  completed: "bg-zinc-500/20 text-zinc-400",
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setProjects(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }

  async function updateProgress(projectId: string, progress: number) {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ progress_percent: progress, updated_at: new Date().toISOString() })
        .eq('id', projectId);
      
      if (error) throw error;
      setProjects(projects.map(p => 
        p.id === projectId ? { ...p, progress_percent: progress } : p
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project');
    }
  }

  const filteredProjects = filter === "all" 
    ? projects 
    : projects.filter(p => p.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Projects</h1>
          <p className="text-zinc-400">Track and manage your projects</p>
        </div>
        <Button className="bg-amber-600 hover:bg-amber-700 w-full md:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400">
          <AlertCircle className="w-5 h-5" />
          {error}
          <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto">
            Dismiss
          </Button>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {["all", "active", "on-hold", "completed"].map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className={filter === f ? "bg-amber-600" : "bg-zinc-800 border-zinc-700 whitespace-nowrap"}
          >
            {f === "on-hold" ? "On Hold" : f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {filteredProjects.map((project) => (
          <Card key={project.id} className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                    <FolderKanban className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-lg truncate">{project.name}</CardTitle>
                    <p className="text-sm text-zinc-400 truncate">{project.description || 'No description'}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Badge className={statusColors[project.status] || statusColors.active}>
                  {project.status}
                </Badge>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-zinc-400">Progress</span>
                  <span className="font-medium">{project.progress_percent}%</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all"
                    style={{ width: `${project.progress_percent}%` }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500 text-xs">
                  Updated {new Date(project.updated_at).toLocaleDateString()}
                </span>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-zinc-800 border-zinc-700 h-7 text-xs"
                    onClick={() => updateProgress(project.id, Math.min(100, project.progress_percent + 10))}
                  >
                    +10%
                  </Button>
                  <Button variant="outline" size="sm" className="bg-zinc-800 border-zinc-700 h-7 text-xs">
                    View
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <Card className="bg-zinc-900 border-zinc-800 p-8 text-center">
          <p className="text-zinc-400">No projects found</p>
        </Card>
      )}
    </div>
  );
}
