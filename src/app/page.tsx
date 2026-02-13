"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase, Agent, ActivityLog, Task, Project } from "@/lib/supabase";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Phone,
  TrendingUp,
  Zap,
  ArrowRight,
  Bot,
  Activity,
  Terminal,
  MessageSquare,
  FileText,
  Globe,
  Loader2,
} from "lucide-react";

const categoryIcons: Record<string, React.ReactNode> = {
  exec: <Terminal className="w-4 h-4 text-amber-500" />,
  file: <FileText className="w-4 h-4 text-green-500" />,
  message: <MessageSquare className="w-4 h-4 text-blue-500" />,
  browser: <Globe className="w-4 h-4 text-pink-500" />,
  tool: <Bot className="w-4 h-4 text-purple-500" />,
  api: <Activity className="w-4 h-4 text-cyan-500" />,
  system: <Zap className="w-4 h-4 text-zinc-500" />,
};

function timeAgo(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
  
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function MissionControl() {
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [recentLogs, setRecentLogs] = useState<(ActivityLog & { agent?: Agent })[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    try {
      const [agentsRes, logsRes, tasksRes, projectsRes] = await Promise.all([
        supabase.from('agents').select('*').order('last_active_at', { ascending: false }),
        supabase.from('activity_logs').select('*, agent:agents(*)').order('timestamp', { ascending: false }).limit(10),
        supabase.from('tasks').select('*').eq('archived', false),
        supabase.from('projects').select('*').eq('status', 'active'),
      ]);

      setAgents(agentsRes.data || []);
      setRecentLogs(logsRes.data || []);
      setTasks(tasksRes.data || []);
      setProjects(projectsRes.data || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }

  const activeAgents = agents.filter(a => a.status === 'active').length;
  const todoTasks = tasks.filter(t => t.column_id === 'todo').length;
  const highPriorityTasks = tasks.filter(t => t.priority === 'high' && t.column_id !== 'done');

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
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">{getGreeting()}, Dan</h1>
        <p className="text-zinc-400">Here's what's happening across your agents</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Active Agents</p>
                <p className="text-2xl font-bold text-green-400">{activeAgents}</p>
              </div>
              <Bot className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Tasks Due</p>
                <p className="text-2xl font-bold">{todoTasks}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Active Projects</p>
                <p className="text-2xl font-bold">{projects.length}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Actions Today</p>
                <p className="text-2xl font-bold">{recentLogs.length}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Agents */}
        <Card className="bg-zinc-900 border-zinc-800 lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bot className="w-5 h-5 text-green-500" />
                Active Agents
              </CardTitle>
              <Link href="/agents">
                <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {agents.slice(0, 4).map((agent) => (
              <div key={agent.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${agent.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-zinc-500'}`} />
                  <div>
                    <span className="font-medium">{agent.label}</span>
                    {agent.current_task && (
                      <p className="text-xs text-zinc-500 truncate max-w-[200px]">{agent.current_task}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={
                    agent.status === 'active' ? "text-green-400 border-green-400/30" :
                    agent.status === 'idle' ? "text-zinc-400 border-zinc-400/30" :
                    "text-blue-400 border-blue-400/30"
                  }>
                    {agent.status}
                  </Badge>
                  <span className="text-xs text-zinc-500">{timeAgo(agent.last_active_at)}</span>
                </div>
              </div>
            ))}
            {agents.length === 0 && (
              <p className="text-center text-zinc-500 py-4">No agents found</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start gap-2 bg-zinc-800 border-zinc-700 hover:bg-zinc-700">
              <Phone className="w-4 h-4" />
              Make a Call
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2 bg-zinc-800 border-zinc-700 hover:bg-zinc-700">
              <CheckCircle2 className="w-4 h-4" />
              Add Task
            </Button>
            <Link href="/agents" className="block">
              <Button variant="outline" className="w-full justify-start gap-2 bg-zinc-800 border-zinc-700 hover:bg-zinc-700">
                <Bot className="w-4 h-4" />
                View Agents
              </Button>
            </Link>
            <Link href="/logs" className="block">
              <Button variant="outline" className="w-full justify-start gap-2 bg-zinc-800 border-zinc-700 hover:bg-zinc-700">
                <Activity className="w-4 h-4" />
                Activity Logs
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* High Priority Tasks */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                High Priority
              </CardTitle>
              <Link href="/tasks">
                <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {highPriorityTasks.slice(0, 4).map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-sm truncate max-w-[180px]">{task.title}</span>
                </div>
                <Badge variant="outline" className="text-red-400 border-red-400/30 text-xs">
                  {task.priority}
                </Badge>
              </div>
            ))}
            {highPriorityTasks.length === 0 && (
              <p className="text-center text-zinc-500 py-4">No high priority tasks</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-zinc-900 border-zinc-800 lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Recent Activity</CardTitle>
              <Link href="/logs">
                <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="flex items-center gap-4 text-sm">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  log.success ? 'bg-green-500/20' : 'bg-red-500/20'
                }`}>
                  {categoryIcons[log.action_category] || <Activity className="w-4 h-4 text-zinc-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate">{log.action_type}</p>
                  <p className="text-zinc-500 text-xs">{log.agent?.label || 'Unknown Agent'}</p>
                </div>
                <span className="text-zinc-500 text-xs whitespace-nowrap">{timeAgo(log.timestamp)}</span>
              </div>
            ))}
            {recentLogs.length === 0 && (
              <p className="text-center text-zinc-500 py-4">No recent activity</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
