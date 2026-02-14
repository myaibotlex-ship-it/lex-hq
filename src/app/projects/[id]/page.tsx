"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase, Project, Task, ActivityLog } from "@/lib/supabase";
import {
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Pause,
  CheckCircle,
  ListTodo,
  Activity,
  FileText,
  Users,
  Calendar,
  Tag,
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

const priorityColors: Record<string, string> = {
  high: "text-red-400 bg-red-500/10 border-red-500/30",
  medium: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  low: "text-zinc-400 bg-zinc-500/10 border-zinc-500/30",
};

const columnLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  todo: { label: "To Do", icon: <Circle className="w-3 h-3" />, color: "text-zinc-400" },
  "in-progress": { label: "In Progress", icon: <Clock className="w-3 h-3" />, color: "text-blue-400" },
  done: { label: "Done", icon: <CheckCircle2 className="w-3 h-3" />, color: "text-green-400" },
};

function useRelativeTime(date: string | null): string {
  if (!date) return "—";
  const now = new Date();
  const then = new Date(date);
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
  
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatDate(date: string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("tasks");

  useEffect(() => {
    if (projectId) {
      fetchProjectData();
    }
  }, [projectId]);

  async function fetchProjectData() {
    try {
      setLoading(true);

      // Fetch project
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);

      // Fetch tasks matching project name as category
      // This links tasks to projects via the category field
      if (projectData) {
        const { data: taskData, error: taskError } = await supabase
          .from("tasks")
          .select("*")
          .eq("category", projectData.name)
          .order("due_date", { ascending: true, nullsFirst: false });

        if (!taskError && taskData) {
          setTasks(taskData);
        }

        // Fetch recent activity logs mentioning this project
        const { data: activityData, error: activityError } = await supabase
          .from("activity_logs")
          .select("*")
          .order("timestamp", { ascending: false })
          .limit(20);

        if (!activityError && activityData) {
          // Filter activities that mention the project in details
          const filtered = activityData.filter((a) => {
            const details = JSON.stringify(a.details || {}).toLowerCase();
            return details.includes(projectData.name.toLowerCase()) || 
                   details.includes("peo") ||
                   details.includes(projectId);
          });
          setActivities(filtered);
        }
      }
    } catch (err) {
      console.error("Error fetching project:", err);
    } finally {
      setLoading(false);
    }
  }

  async function updateTaskStatus(taskId: string, newStatus: string) {
    const { error } = await supabase
      .from("tasks")
      .update({ column_id: newStatus, updated_at: new Date().toISOString() })
      .eq("id", taskId);

    if (!error) {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, column_id: newStatus } : t))
      );
    }
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-6 animate-fade-in">
        <div className="skeleton h-8 w-64 mb-4" />
        <div className="skeleton h-32 w-full rounded-lg" />
        <div className="skeleton h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-4 md:p-6">
        <div className="text-center py-12">
          <AlertTriangle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Project Not Found</h2>
          <Button variant="outline" onClick={() => router.push("/projects")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  const todoTasks = tasks.filter((t) => t.column_id === "todo" && !t.archived);
  const inProgressTasks = tasks.filter((t) => t.column_id === "in-progress" && !t.archived);
  const doneTasks = tasks.filter((t) => t.column_id === "done" && !t.archived);
  const blockerTasks = tasks.filter((t) => t.labels?.includes("launch-blocker") && t.column_id !== "done");

  // Extract URL from description if present
  const urlMatch = project.description?.match(/URL:\s*(https?:\/\/[^\s]+)/i);
  const projectUrl = urlMatch ? urlMatch[1] : null;

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="mb-2 -ml-2 text-zinc-400 hover:text-white"
            onClick={() => router.push("/projects")}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Projects
          </Button>
          <h1 className="text-2xl md:text-3xl font-display font-bold">{project.name}</h1>
          <p className="text-zinc-400 mt-1">{project.description?.replace(/URL:\s*https?:\/\/[^\s]+/i, "").trim()}</p>
          {projectUrl && (
            <a
              href={projectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-amber-500 hover:text-amber-400 text-sm mt-2"
            >
              {projectUrl.replace("https://", "")}
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
        <Badge className={`${statusColors[project.status]} border`}>
          {statusIcons[project.status]}
          <span className="ml-1">{project.status}</span>
        </Badge>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-3">
            <div className="text-xs text-zinc-500 uppercase tracking-wider">Progress</div>
            <div className="text-2xl font-bold font-terminal text-amber-500">{project.progress_percent}%</div>
            <div className="h-1 bg-zinc-800 rounded-full mt-2">
              <div
                className="h-1 bg-amber-500 rounded-full transition-all"
                style={{ width: `${project.progress_percent}%` }}
              />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-3">
            <div className="text-xs text-zinc-500 uppercase tracking-wider">To Do</div>
            <div className="text-2xl font-bold font-terminal">{todoTasks.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-3">
            <div className="text-xs text-zinc-500 uppercase tracking-wider">In Progress</div>
            <div className="text-2xl font-bold font-terminal text-blue-400">{inProgressTasks.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-3">
            <div className="text-xs text-zinc-500 uppercase tracking-wider">Done</div>
            <div className="text-2xl font-bold font-terminal text-green-400">{doneTasks.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800 border-red-500/30">
          <CardContent className="p-3">
            <div className="text-xs text-zinc-500 uppercase tracking-wider">Blockers</div>
            <div className="text-2xl font-bold font-terminal text-red-400">{blockerTasks.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Launch Blockers Alert */}
      {blockerTasks.length > 0 && (
        <Card className="bg-red-500/5 border-red-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Launch Blockers ({blockerTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {blockerTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-2 bg-zinc-900/50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <Circle className="w-3 h-3 text-red-400" />
                    <span className="text-sm">{task.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {task.due_date && (
                      <span className="text-xs text-zinc-500">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {formatDate(task.due_date)}
                      </span>
                    )}
                    {task.labels?.filter(l => l.startsWith("agent:")).map((label) => (
                      <Badge key={label} variant="outline" className="text-xs border-zinc-700">
                        <Users className="w-3 h-3 mr-1" />
                        {label.replace("agent:", "")}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="tasks" className="gap-2">
            <ListTodo className="w-4 h-4" />
            Tasks ({tasks.length})
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="w-4 h-4" />
            Activity ({activities.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* To Do Column */}
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-zinc-400">
                  <Circle className="w-4 h-4" />
                  To Do ({todoTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
                {todoTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onStatusChange={updateTaskStatus} />
                ))}
                {todoTasks.length === 0 && (
                  <div className="text-zinc-600 text-sm text-center py-4">No tasks</div>
                )}
              </CardContent>
            </Card>

            {/* In Progress Column */}
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-400">
                  <Clock className="w-4 h-4" />
                  In Progress ({inProgressTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
                {inProgressTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onStatusChange={updateTaskStatus} />
                ))}
                {inProgressTasks.length === 0 && (
                  <div className="text-zinc-600 text-sm text-center py-4">No tasks</div>
                )}
              </CardContent>
            </Card>

            {/* Done Column */}
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-green-400">
                  <CheckCircle2 className="w-4 h-4" />
                  Done ({doneTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
                {doneTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onStatusChange={updateTaskStatus} />
                ))}
                {doneTasks.length === 0 && (
                  <div className="text-zinc-600 text-sm text-center py-4">No tasks</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-4">
              {activities.length > 0 ? (
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-3 bg-zinc-800/50 rounded-lg"
                    >
                      <div
                        className={`w-2 h-2 rounded-full mt-2 ${
                          activity.success ? "bg-green-500" : "bg-red-500"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{activity.action_type}</span>
                          <Badge variant="outline" className="text-xs border-zinc-700">
                            {activity.action_category}
                          </Badge>
                        </div>
                        <div className="text-xs text-zinc-500 font-terminal">
                          {typeof activity.details === "object"
                            ? JSON.stringify(activity.details).slice(0, 100)
                            : String(activity.details || "").slice(0, 100)}
                        </div>
                        <div className="text-xs text-zinc-600 mt-1">
                          {useRelativeTime(activity.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-zinc-600">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No activity logged yet</p>
                  <p className="text-xs mt-1">Agent updates will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TaskCard({
  task,
  onStatusChange,
}: {
  task: Task;
  onStatusChange: (id: string, status: string) => void;
}) {
  const isBlocker = task.labels?.includes("launch-blocker");
  const agentLabel = task.labels?.find((l) => l.startsWith("agent:"));

  return (
    <div
      className={`p-3 rounded-lg border transition-all hover:border-zinc-600 ${
        isBlocker
          ? "bg-red-500/5 border-red-500/30"
          : "bg-zinc-800/50 border-zinc-700/50"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium leading-tight">{task.title}</h4>
          {task.description && (
            <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{task.description}</p>
          )}
        </div>
        {task.priority && (
          <Badge className={`text-xs shrink-0 ${priorityColors[task.priority]}`}>
            {task.priority}
          </Badge>
        )}
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-700/50">
        <div className="flex items-center gap-2">
          {task.due_date && (
            <span className="text-xs text-zinc-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(task.due_date)}
            </span>
          )}
          {agentLabel && (
            <Badge variant="outline" className="text-xs border-zinc-700 px-1.5">
              <Users className="w-3 h-3 mr-1" />
              {agentLabel.replace("agent:", "")}
            </Badge>
          )}
          {isBlocker && (
            <Badge variant="outline" className="text-xs border-red-500/50 text-red-400 px-1.5">
              blocker
            </Badge>
          )}
        </div>

        {/* Quick status change */}
        <div className="flex gap-1">
          {task.column_id !== "in-progress" && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs text-blue-400 hover:text-blue-300"
              onClick={() => onStatusChange(task.id, "in-progress")}
            >
              Start
            </Button>
          )}
          {task.column_id !== "done" && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs text-green-400 hover:text-green-300"
              onClick={() => onStatusChange(task.id, "done")}
            >
              Done
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
