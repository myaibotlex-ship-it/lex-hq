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
  Loader2,
  AlertCircle,
} from "lucide-react";

const priorityColors = {
  low: "text-blue-400 border-blue-400/30",
  medium: "text-amber-400 border-amber-400/30",
  high: "text-red-400 border-red-400/30",
};

const columns = [
  { id: "todo", title: "To Do", icon: Circle },
  { id: "in_progress", title: "In Progress", icon: Clock },
  { id: "done", title: "Done", icon: CheckCircle2 },
];

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
    if (diff < 7) return `${diff} days`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

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
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Tasks</h1>
          <p className="text-zinc-400">Manage your to-dos and follow-ups</p>
        </div>
        <div className="flex gap-2 md:gap-4">
          <Input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add a new task..."
            className="flex-1 md:w-64 bg-zinc-800 border-zinc-700"
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            disabled={adding}
          />
          <Button onClick={addTask} className="bg-amber-600 hover:bg-amber-700" disabled={adding}>
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 md:mr-2" />}
            <span className="hidden md:inline">Add Task</span>
          </Button>
        </div>
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

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {columns.map((column) => (
          <Card key={column.id} className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <column.icon className={`w-5 h-5 ${
                  column.id === "done" ? "text-green-500" : 
                  column.id === "in_progress" ? "text-amber-500" : "text-zinc-400"
                }`} />
                {column.title}
                <Badge variant="outline" className="ml-auto">
                  {tasks.filter(t => t.column_id === column.id).length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[60vh] overflow-y-auto">
              {tasks
                .filter((task) => task.column_id === column.id)
                .map((task) => (
                  <div
                    key={task.id}
                    className="p-4 bg-zinc-800 rounded-lg border border-zinc-700 hover:border-zinc-600 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className={`font-medium ${task.column_id === "done" ? "line-through text-zinc-500" : ""}`}>
                        {task.title}
                      </p>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={priorityColors[task.priority as keyof typeof priorityColors] || priorityColors.medium}>
                        {task.priority}
                      </Badge>
                      {task.due_date && (
                        <span className="text-xs text-zinc-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDueDate(task.due_date)}
                        </span>
                      )}
                      {task.category && (
                        <Badge variant="outline" className="text-zinc-400 border-zinc-600 text-xs">
                          {task.category}
                        </Badge>
                      )}
                    </div>
                    {task.column_id !== "done" && (
                      <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        {task.column_id === "todo" && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-xs h-7"
                            onClick={() => moveTask(task.id, "in_progress")}
                          >
                            Start
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-xs h-7 text-green-400 border-green-400/30"
                          onClick={() => moveTask(task.id, "done")}
                        >
                          Complete
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              {tasks.filter(t => t.column_id === column.id).length === 0 && (
                <p className="text-center text-zinc-500 py-4">No tasks</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
