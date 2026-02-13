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
  AlertCircle,
  TrendingUp,
  Pause,
  CheckCircle,
  ArrowUpRight,
} from "lucide-react";

const statusColors: Record<string, string> = {
  active: "badge-active",
  "on-hold": "badge-warning",
  completed: "text-zinc-400 border-zinc-600",
};

const statusIcons: Record<string, React.ReactNode> = {
  active: <TrendingUp className="w-3 h-3" />,
  "on-hold": <Pause className="w-3 h-3" />,
  completed: <CheckCircle className="w-3 h-3" />,
};

function LoadingSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="skeleton h-8 w-28 mb-2" />
          <div className="skeleton h-4 w-48" />
        </div>
        <div className="skeleton h-9 w-32 rounded-lg" />
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton h-8 w-20 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton h-48 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

function useRelativeTime(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
  
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

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

  const counts = {
    all: projects.length,
    active: projects.filter(p => p.status === 'active').length,
    'on-hold': projects.filter(p => p.status === 'on-hold').length,
    completed: projects.filter(p => p.status === 'completed').length,
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">Projects</h1>
          <p className="text-zinc-500 text-sm">Track and manage your projects</p>
        </div>
        <Button className="btn-primary-glow h-9 text-sm w-full md:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400 text-sm animate-fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <Button variant="ghost" size="sm" onClick={() => setError(null)} className="h-7 text-xs">
            Dismiss
          </Button>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 animate-fade-in stagger-1 opacity-0">
        {(["all", "active", "on-hold", "completed"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className={`h-8 text-xs whitespace-nowrap ${
              filter === f 
                ? "btn-primary-glow" 
                : "bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800"
            }`}
          >
            {f === "on-hold" ? "On Hold" : f.charAt(0).toUpperCase() + f.slice(1)}
            <Badge variant="outline" className="ml-2 text-[10px] bg-zinc-900/50 border-zinc-700">
              {counts[f]}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredProjects.map((project, index) => (
          <Card 
            key={project.id} 
            className="bg-zinc-900/80 border-zinc-800 card-glow animate-fade-in opacity-0"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <CardHeader className="pb-2 px-4 pt-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    project.status === 'active' ? 'bg-emerald-500/10' : 
                    project.status === 'on-hold' ? 'bg-amber-500/10' : 'bg-zinc-800'
                  }`}>
                    <FolderKanban className={`w-5 h-5 ${
                      project.status === 'active' ? 'text-emerald-400' :
                      project.status === 'on-hold' ? 'text-amber-400' : 'text-zinc-500'
                    }`} />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-base truncate">{project.name}</CardTitle>
                    <p className="text-xs text-zinc-500 truncate">{project.description || 'No description'}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0 opacity-0 hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex gap-2 mb-3">
                <Badge className={`${statusColors[project.status]} text-xs`} variant="outline">
                  <span className="mr-1">{statusIcons[project.status]}</span>
                  {project.status}
                </Badge>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-zinc-500 uppercase tracking-wider">Progress</span>
                  <span className="font-terminal font-medium">{project.progress_percent}%</span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      project.progress_percent === 100 ? 'bg-emerald-500' :
                      project.progress_percent >= 50 ? 'bg-gradient-to-r from-amber-500 to-amber-400' :
                      'bg-gradient-to-r from-amber-600 to-amber-500'
                    } ${project.progress_percent > 0 ? 'progress-glow' : ''}`}
                    style={{ width: `${project.progress_percent}%` }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-600 text-xs">
                  Updated {useRelativeTime(project.updated_at)}
                </span>
                <div className="flex gap-2">
                  {project.status !== 'completed' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="bg-zinc-800/50 border-zinc-700 h-7 text-xs hover:bg-zinc-700"
                      onClick={() => updateProgress(project.id, Math.min(100, project.progress_percent + 10))}
                    >
                      +10%
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="bg-zinc-800/50 border-zinc-700 h-7 text-xs hover:bg-zinc-700">
                    View
                    <ArrowUpRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <Card className="bg-zinc-900/80 border-zinc-800 animate-fade-in">
          <CardContent className="empty-state">
            <FolderKanban className="empty-state-icon" />
            <p className="empty-state-text">No projects found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
