"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase, Agent, ActivityLog, Task, Project, Call } from "@/lib/supabase";
import { NewTaskModal } from "@/components/modals/new-task-modal";
import { StartCallModal } from "@/components/modals/start-call-modal";
import { SystemStatus } from "@/components/system-status";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
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
  Mail,
  Filter,
} from "lucide-react";

const categoryIcons: Record<string, React.ReactNode> = {
  exec: <Terminal className="w-4 h-4 text-primary" />,
  file: <FileText className="w-4 h-4 text-green-500" />,
  message: <MessageSquare className="w-4 h-4 text-blue-500" />,
  browser: <Globe className="w-4 h-4 text-pink-500" />,
  tool: <Bot className="w-4 h-4 text-purple-500" />,
  api: <Activity className="w-4 h-4 text-cyan-500" />,
  system: <Zap className="w-4 h-4 text-muted-foreground" />,
};

const categoryFilters = ["all", "exec", "file", "message", "browser", "tool", "api", "system"];

function useRelativeTime(date: string): string {
  const [, setTick] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 10000);
    return () => clearInterval(interval);
  }, []);
  
  const now = new Date();
  const then = new Date(date);
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
  
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function TimeAgo({ date }: { date: string }) {
  const relative = useRelativeTime(date);
  return <span>{relative}</span>;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function LoadingSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="mb-6">
        <div className="skeleton h-8 w-48 mb-2" />
        <div className="skeleton h-4 w-64" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton h-24 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 skeleton h-64 rounded-lg" />
        <div className="skeleton h-64 rounded-lg" />
      </div>
    </div>
  );
}

export default function MissionControl() {
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [recentLogs, setRecentLogs] = useState<(ActivityLog & { agent?: Agent })[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [activityFilter, setActivityFilter] = useState("all");
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [todayActivityCount, setTodayActivityCount] = useState(0);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onNewTask: () => setShowNewTaskModal(true),
    onSearch: () => {
      // TODO: Implement search modal
      console.log("Search triggered");
    },
  });

  const fetchData = useCallback(async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [agentsRes, logsRes, tasksRes, projectsRes, callsRes, todayLogsRes] = await Promise.all([
        supabase.from('agents').select('*').order('last_active_at', { ascending: false }),
        supabase.from('activity_logs').select('*, agent:agents(*)').order('timestamp', { ascending: false }).limit(20),
        supabase.from('tasks').select('*').eq('archived', false),
        supabase.from('projects').select('*').eq('status', 'active'),
        supabase.from('calls').select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from('activity_logs').select('id', { count: 'exact' }).gte('timestamp', today.toISOString()),
      ]);

      setAgents(agentsRes.data || []);
      setRecentLogs(logsRes.data || []);
      setTasks(tasksRes.data || []);
      setProjects(projectsRes.data || []);
      setCalls(callsRes.data || []);
      setTodayActivityCount(todayLogsRes.count || 0);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Refresh agents every 10 seconds
    const agentInterval = setInterval(async () => {
      const { data } = await supabase.from('agents').select('*').order('last_active_at', { ascending: false });
      if (data) setAgents(data);
    }, 10000);
    
    // Refresh other data every 30 seconds
    const dataInterval = setInterval(fetchData, 30000);
    
    return () => {
      clearInterval(agentInterval);
      clearInterval(dataInterval);
    };
  }, [fetchData]);

  const activeAgents = agents.filter(a => a.status === 'active').length;
  const todoTasks = tasks.filter(t => t.column_id === 'todo').length;
  const highPriorityTasks = tasks.filter(t => t.priority === 'high' && t.column_id !== 'done');
  const completedTasks = tasks.filter(t => t.column_id === 'done').length;
  const successRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const filteredLogs = activityFilter === "all" 
    ? recentLogs 
    : recentLogs.filter(log => log.action_category === activityFilter);

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl md:text-3xl font-bold mb-1">{getGreeting()}, Dan</h1>
        <p className="text-muted-foreground text-sm">Here's what's happening across your agents</p>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Card className="bg-card border-border hero-stat card-glow animate-fade-in stagger-1 opacity-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Active Agents</p>
                <p className="text-3xl font-bold text-accent mt-1">{activeAgents}</p>
                <p className="text-xs text-muted-foreground mt-1">{agents.length} total</p>
              </div>
              <div className="relative">
                <Bot className="w-10 h-10 text-accent/30" />
                {activeAgents > 0 && (
                  <span className="absolute -top-1 -right-1 status-dot status-dot-active" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border hero-stat card-glow animate-fade-in stagger-2 opacity-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Tasks Due</p>
                <p className="text-3xl font-bold mt-1">{todoTasks}</p>
                <p className="text-xs text-muted-foreground mt-1">{successRate}% complete</p>
              </div>
              <CheckCircle2 className="w-10 h-10 text-primary/30" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border hero-stat card-glow animate-fade-in stagger-3 opacity-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Calls Today</p>
                <p className="text-3xl font-bold mt-1">{calls.filter(c => {
                  const today = new Date();
                  const callDate = new Date(c.created_at);
                  return callDate.toDateString() === today.toDateString();
                }).length}</p>
                <p className="text-xs text-muted-foreground mt-1">{calls.length} total</p>
              </div>
              <Phone className="w-10 h-10 text-primary/30" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border hero-stat card-glow animate-fade-in stagger-4 opacity-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Actions Today</p>
                <p className="text-3xl font-bold mt-1">{todayActivityCount}</p>
                <p className="text-xs text-muted-foreground mt-1">{projects.length} active projects</p>
              </div>
              <Activity className="w-10 h-10 text-blue-500/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Active Agents */}
        <Card className="bg-card border-border lg:col-span-2 card-glow animate-slide-up stagger-2 opacity-0">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
                <Bot className="w-4 h-4 text-accent" />
                Active Agents
                <span className="ml-1 px-1.5 py-0.5 bg-secondary rounded text-xs font-normal">
                  auto-refresh 10s
                </span>
              </CardTitle>
              <Link href="/agents">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white h-7 text-xs">
                  View All <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {agents.slice(0, 4).map((agent, index) => (
              <div 
                key={agent.id} 
                className="flex items-center justify-between p-3 bg-secondary/60 rounded-lg border border-border/50 hover:border-border transition-all duration-200 hover:bg-muted group"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`status-dot flex-shrink-0 ${
                    agent.status === 'active' ? 'status-dot-active' : 
                    agent.status === 'idle' ? 'status-dot-idle' : 'status-dot-complete'
                  }`} />
                  <div className="min-w-0">
                    <span className="font-medium text-sm">{agent.label}</span>
                    {agent.current_task && (
                      <p className="text-xs text-muted-foreground truncate max-w-[200px] font-terminal">{agent.current_task}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant="outline" className={`text-xs ${
                    agent.status === 'active' ? "badge-active" :
                    agent.status === 'idle' ? "badge-warning" :
                    "text-muted-foreground border-border"
                  }`}>
                    {agent.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    <TimeAgo date={agent.last_active_at} />
                  </span>
                </div>
              </div>
            ))}
            {agents.length === 0 && (
              <div className="empty-state">
                <Bot className="empty-state-icon" />
                <p className="empty-state-text">No agents found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-card border-border card-glow animate-slide-in-right stagger-3 opacity-0">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2 bg-secondary border-border hover:bg-secondary hover:border-border h-10 text-sm interactive"
              onClick={() => setShowCallModal(true)}
            >
              <Phone className="w-4 h-4 text-primary" />
              Start Call
              <kbd className="ml-auto px-1.5 py-0.5 bg-muted rounded text-xs text-muted-foreground">soon</kbd>
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2 bg-secondary border-border hover:bg-secondary hover:border-border h-10 text-sm interactive"
              onClick={() => setShowNewTaskModal(true)}
            >
              <CheckCircle2 className="w-4 h-4 text-accent" />
              New Task
              <kbd className="ml-auto px-1.5 py-0.5 bg-muted rounded text-xs text-muted-foreground">n</kbd>
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2 bg-secondary border-border hover:bg-secondary hover:border-border h-10 text-sm interactive opacity-60"
              disabled
            >
              <Mail className="w-4 h-4 text-blue-500" />
              Check Email
              <span className="ml-auto text-xs text-muted-foreground">coming soon</span>
            </Button>
            <Link href="/agents" className="block">
              <Button variant="outline" className="w-full justify-start gap-2 bg-secondary border-border hover:bg-secondary hover:border-border h-10 text-sm interactive">
                <Bot className="w-4 h-4 text-purple-500" />
                View Agents
                <kbd className="ml-auto px-1.5 py-0.5 bg-muted rounded text-xs text-muted-foreground">g a</kbd>
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* High Priority Tasks */}
        <Card className="bg-card border-border card-glow animate-slide-up stagger-4 opacity-0">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
                <Zap className="w-4 h-4 text-red-500" />
                High Priority
              </CardTitle>
              <Link href="/tasks">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white h-6 w-6 p-0">
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {highPriorityTasks.slice(0, 4).map((task) => (
              <div key={task.id} className="flex items-center justify-between p-2.5 bg-secondary/60 rounded-lg border border-border/50 hover:border-red-500/20 transition-all">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="status-dot status-dot-error flex-shrink-0" />
                  <span className="text-sm truncate">{task.title}</span>
                </div>
                <Badge variant="outline" className="badge-error text-xs flex-shrink-0">
                  {task.priority}
                </Badge>
              </div>
            ))}
            {highPriorityTasks.length === 0 && (
              <div className="empty-state py-6">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-zinc-700" />
                <p className="empty-state-text text-xs">No high priority tasks</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-card border-border lg:col-span-2 card-glow animate-slide-up stagger-5 opacity-0">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recent Activity</CardTitle>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-secondary rounded-lg p-0.5">
                  {categoryFilters.slice(0, 5).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setActivityFilter(filter)}
                      className={`px-2 py-1 rounded text-xs transition-colors ${
                        activityFilter === filter
                          ? "bg-muted text-white"
                          : "text-muted-foreground hover:text-zinc-300"
                      }`}
                    >
                      {filter === "all" ? "All" : filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </button>
                  ))}
                </div>
                <Link href="/logs">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white h-7 text-xs">
                    View All <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 activity-stream max-h-72 overflow-y-auto">
            <div className="space-y-1">
              {filteredLogs.slice(0, 8).map((log) => (
                <div key={log.id} className="flex items-center gap-3 p-2 rounded-lg log-entry group">
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${
                    log.success ? 'bg-accent/10' : 'bg-red-500/10'
                  }`}>
                    {categoryIcons[log.action_category] || <Activity className="w-3.5 h-3.5 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate font-terminal">{log.action_type}</p>
                    <p className="text-muted-foreground text-xs">{log.agent?.label || 'System'}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`w-1.5 h-1.5 rounded-full ${log.success ? 'bg-accent' : 'bg-red-500'}`} />
                    <span className="text-muted-foreground text-xs">
                      <TimeAgo date={log.timestamp} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {filteredLogs.length === 0 && (
              <div className="empty-state py-6">
                <Activity className="w-10 h-10 mx-auto mb-2 text-zinc-700" />
                <p className="empty-state-text text-xs">
                  {activityFilter === "all" ? "No recent activity" : `No ${activityFilter} activity`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* System Status Bar */}
      <div className="mt-6 pt-4 border-t border-border">
        <SystemStatus />
      </div>

      {/* Modals */}
      <NewTaskModal
        isOpen={showNewTaskModal}
        onClose={() => setShowNewTaskModal(false)}
        onSuccess={fetchData}
      />
      <StartCallModal
        isOpen={showCallModal}
        onClose={() => setShowCallModal(false)}
        onSuccess={fetchData}
      />
    </div>
  );
}
