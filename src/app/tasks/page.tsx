"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase, Task } from "@/lib/supabase";
import {
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  MoreHorizontal,
  AlertCircle,
  Play,
  Check,
} from "lucide-react";

const priorityColors = {
  low: "text-blue-400 border-blue-400/30",
  medium: "badge-warning",
  high: "badge-error",
};

const columns = [
  { id: "todo", title: "To Do", icon: Circle, color: "text-muted-foreground" },
  { id: "in_progress", title: "In Progress", icon: Clock, color: "text-primary" },
  { id: "done", title: "Done", icon: CheckCircle2, color: "text-accent" },
];

function LoadingSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="skeleton h-8 w-24 mb-2" />
          <div className="skeleton h-4 w-48" />
        </div>
        <div className="flex gap-2">
          <div className="skeleton h-9 w-48 rounded-lg" />
          <div className="skeleton h-9 w-24 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="skeleton h-96 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTask, setNewTask] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('archived', false)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTasks(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }

  async function addTask() {
    if (!newTask.trim()) return;
    setAdding(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: newTask,
          category: 'general',
          column_id: 'todo',
          priority: 'medium',
        })
        .select()
        .single();
      
      if (error) throw error;
      setTasks([data, ...tasks]);
      setNewTask("");
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add task');
    } finally {
      setAdding(false);
    }
  }

  async function moveTask(taskId: string, newColumnId: string) {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ column_id: newColumnId, updated_at: new Date().toISOString() })
        .eq('id', taskId);
      
      if (error) throw error;
      setTasks(tasks.map(t => 
        t.id === taskId ? { ...t, column_id: newColumnId as Task['column_id'] } : t
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
    }
  }

  function formatDueDate(date: string | null): string {
    if (!date) return '';
    const d = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff < 0) return 'Overdue';
    if (diff < 7) return `${diff} days`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  if (loading) {
    return <LoadingSkeleton />;
  }

  const taskCounts = {
    todo: tasks.filter(t => t.column_id === 'todo').length,
    in_progress: tasks.filter(t => t.column_id === 'in_progress').length,
    done: tasks.filter(t => t.column_id === 'done').length,
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">Tasks</h1>
          <p className="text-muted-foreground text-sm">Manage your to-dos and follow-ups</p>
        </div>
        <div className="flex gap-2">
          <Input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add a new task..."
            className="flex-1 md:w-64 bg-secondary border-border h-9 text-sm"
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            disabled={adding}
          />
          <Button onClick={addTask} className="btn-primary-glow h-9 text-sm" disabled={adding}>
            {adding ? (
              <div className="skeleton w-4 h-4 rounded-full" />
            ) : (
              <Plus className="w-4 h-4 md:mr-2" />
            )}
            <span className="hidden md:inline">Add Task</span>
          </Button>
        </div>
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

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((column, colIndex) => (
          <Card 
            key={column.id} 
            className="bg-card border-border card-glow animate-fade-in opacity-0"
            style={{ animationDelay: `${colIndex * 0.1}s` }}
          >
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
                <column.icon className={`w-4 h-4 ${column.color}`} />
                {column.title}
                <Badge variant="outline" className="ml-auto text-xs bg-secondary border-border">
                  {taskCounts[column.id as keyof typeof taskCounts]}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 space-y-2 max-h-[60vh] overflow-y-auto activity-stream">
              {tasks
                .filter((task) => task.column_id === column.id)
                .map((task, index) => (
                  <div
                    key={task.id}
                    className="p-3 bg-secondary/60 rounded-lg border border-border/50 hover:border-border transition-all cursor-pointer group animate-fade-in opacity-0"
                    style={{ animationDelay: `${(colIndex * 0.1) + (index * 0.03)}s` }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className={`font-medium text-sm ${task.column_id === "done" ? "line-through text-muted-foreground" : ""}`}>
                        {task.title}
                      </p>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 transition-opacity">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={`text-xs ${priorityColors[task.priority as keyof typeof priorityColors] || priorityColors.medium}`}>
                        {task.priority}
                      </Badge>
                      {task.due_date && (
                        <span className={`text-xs flex items-center gap-1 ${
                          formatDueDate(task.due_date) === 'Overdue' ? 'text-red-400' : 'text-muted-foreground'
                        }`}>
                          <Calendar className="w-3 h-3" />
                          {formatDueDate(task.due_date)}
                        </span>
                      )}
                      {task.category && (
                        <Badge variant="outline" className="text-muted-foreground border-border text-xs">
                          {task.category}
                        </Badge>
                      )}
                    </div>
                    {task.column_id !== "done" && (
                      <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {task.column_id === "todo" && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-xs h-7 bg-secondary border-border hover:bg-muted"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveTask(task.id, "in_progress");
                            }}
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Start
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-xs h-7 text-accent border-accent/30 hover:bg-accent/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveTask(task.id, "done");
                          }}
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Complete
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              {tasks.filter(t => t.column_id === column.id).length === 0 && (
                <div className="empty-state py-8">
                  <column.icon className="w-8 h-8 mx-auto mb-2 text-zinc-700" />
                  <p className="empty-state-text text-xs">No tasks</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
