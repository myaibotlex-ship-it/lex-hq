"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase, MCAgent, Task, Upgrade, UpgradeStatus } from "@/lib/supabase";
import {
  Bot,
  Activity,
  Clock,
  AlertCircle,
  RefreshCw,
  Users,
  Zap,
  FileText,
  ListTodo,
  Rocket,
  Send,
  ExternalLink,
  CheckCircle2,
  Circle,
  Loader2,
  Wifi,
  WifiOff,
  Coffee,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

const statusConfig: Record<string, { color: string; icon: React.ReactNode; dotColor: string }> = {
  active: {
    color: "badge-active",
    icon: <Wifi className="w-3 h-3" />,
    dotColor: "bg-green-500",
  },
  idle: {
    color: "badge-warning",
    icon: <Coffee className="w-3 h-3" />,
    dotColor: "bg-yellow-500",
  },
  offline: {
    color: "text-muted-foreground border-border",
    icon: <WifiOff className="w-3 h-3" />,
    dotColor: "bg-zinc-500",
  },
};

const priorityColors: Record<string, string> = {
  low: "bg-zinc-600/50 text-muted-foreground",
  medium: "bg-blue-500/20 text-blue-400",
  high: "bg-red-500/20 text-red-400",
};

const upgradeStatusColors: Record<UpgradeStatus, string> = {
  planned: "bg-zinc-500/20 text-muted-foreground border-zinc-500/30",
  in_progress: "bg-primary/20 text-primary border-primary/30",
  deployed: "bg-accent/20 text-accent border-accent/30",
  rejected: "bg-red-500/20 text-red-400 border-red-500/30",
};

function useRelativeTime(date: string | null): string {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 10000);
    return () => clearInterval(interval);
  }, []);

  if (!date) return "Never";

  const now = new Date();
  const then = new Date(date);
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function TimeAgo({ date }: { date: string | null }) {
  const relative = useRelativeTime(date);
  return <span>{relative}</span>;
}

function LoadingSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="skeleton h-8 w-32 mb-2" />
          <div className="skeleton h-4 w-48" />
        </div>
        <div className="skeleton h-10 w-24 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-20 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="skeleton h-48 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<MCAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<MCAgent | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchAgents = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from("mc_agents")
        .select("*")
        .order("last_seen_at", { ascending: false });

      if (fetchError) throw fetchError;
      setAgents(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load agents");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
    const interval = setInterval(fetchAgents, 15000);
    return () => clearInterval(interval);
  }, [fetchAgents]);

  const handleAgentClick = (agent: MCAgent) => {
    setSelectedAgent(agent);
    setDialogOpen(true);
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  const activeCount = agents.filter((a) => a.status === "active").length;
  const idleCount = agents.filter((a) => a.status === "idle").length;
  const offlineCount = agents.filter((a) => a.status === "offline").length;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1 flex items-center gap-3">
            <Users className="w-7 h-7 text-primary" />
            Agents
          </h1>
          <p className="text-muted-foreground text-sm">
            Monitor and manage your agent team
          </p>
        </div>
        <Button
          onClick={fetchAgents}
          variant="outline"
          className="bg-secondary border-border hover:bg-secondary h-9 text-sm"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400 text-sm animate-fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
            className="h-7 text-xs"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="bg-card border-border hero-stat card-glow animate-fade-in stagger-1 opacity-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider">
                  Total Agents
                </p>
                <p className="text-2xl font-bold mt-1">{agents.length}</p>
              </div>
              <Bot className="w-8 h-8 text-primary/30" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border hero-stat card-glow animate-fade-in stagger-2 opacity-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider">
                  Active
                </p>
                <p className="text-2xl font-bold text-accent mt-1">
                  {activeCount}
                </p>
              </div>
              <div className="relative">
                <Activity className="w-8 h-8 text-accent/30" />
                {activeCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border hero-stat card-glow animate-fade-in stagger-3 opacity-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider">
                  Idle
                </p>
                <p className="text-2xl font-bold text-yellow-500 mt-1">
                  {idleCount}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border hero-stat card-glow animate-fade-in stagger-4 opacity-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider">
                  Offline
                </p>
                <p className="text-2xl font-bold text-muted-foreground mt-1">
                  {offlineCount}
                </p>
              </div>
              <WifiOff className="w-8 h-8 text-zinc-600/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agents Grid */}
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 animate-fade-in">
        All Agents
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent, index) => (
          <Card
            key={agent.id}
            className="bg-card border-border cursor-pointer transition-all card-glow hover:border-primary/50 hover:ring-1 hover:ring-primary/20 animate-fade-in opacity-0"
            onClick={() => handleAgentClick(agent)}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${
                      agent.status === "active"
                        ? "bg-accent/10"
                        : agent.status === "idle"
                        ? "bg-yellow-500/10"
                        : "bg-secondary"
                    }`}
                  >
                    {agent.avatar_emoji || "🤖"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm">
                        {agent.display_name}
                      </h3>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          statusConfig[agent.status]?.dotColor || "bg-zinc-500"
                        } ${agent.status === "active" ? "animate-pulse" : ""}`}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground capitalize">
                      {agent.type}
                    </p>
                  </div>
                </div>
                <Badge
                  className={statusConfig[agent.status]?.color}
                  variant="outline"
                >
                  {statusConfig[agent.status]?.icon}
                  <span className="ml-1">{agent.status}</span>
                </Badge>
              </div>

              {agent.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {agent.description}
                </p>
              )}

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
                <span>
                  Last seen: <TimeAgo date={agent.last_seen_at} />
                </span>
                {agent.config && (
                  <span className="bg-secondary px-2 py-0.5 rounded">
                    {(agent.config as Record<string, number>).sessions_today || 0} sessions today
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {agents.length === 0 && (
          <Card className="bg-card border-border col-span-full animate-fade-in">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bot className="w-16 h-16 text-zinc-700 mb-4" />
              <p className="text-muted-foreground text-sm">No agents found</p>
              <p className="text-zinc-600 text-xs mt-1">
                Agents will appear here once configured
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Agent Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0">
          {selectedAgent && (
            <AgentDetailView
              agent={selectedAgent}
              onClose={() => setDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AgentDetailView({
  agent,
  onClose,
}: {
  agent: MCAgent;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState("overview");
  const [soulContent, setSoulContent] = useState<string | null>(null);
  const [soulLoading, setSoulLoading] = useState(false);
  const [soulError, setSoulError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [upgrades, setUpgrades] = useState<Upgrade[]>([]);
  const [upgradesLoading, setUpgradesLoading] = useState(false);
  const [upgradeSuggestion, setUpgradeSuggestion] = useState("");
  const [submittingUpgrade, setSubmittingUpgrade] = useState(false);

  // Fetch SOUL.md when SOUL tab is selected
  useEffect(() => {
    if (activeTab === "soul" && soulContent === null && !soulLoading) {
      fetchSoul();
    }
  }, [activeTab]);

  // Fetch tasks when Tasks tab is selected
  useEffect(() => {
    if (activeTab === "tasks" && tasks.length === 0 && !tasksLoading) {
      fetchTasks();
    }
  }, [activeTab]);

  // Fetch upgrades when Upgrades tab is selected
  useEffect(() => {
    if (activeTab === "upgrades" && upgrades.length === 0 && !upgradesLoading) {
      fetchUpgrades();
    }
  }, [activeTab]);

  async function fetchSoul() {
    setSoulLoading(true);
    setSoulError(null);
    try {
      const res = await fetch(`/api/agents/${agent.name}/soul`);
      const data = await res.json();
      if (data.error) {
        setSoulError(data.error);
      } else {
        setSoulContent(data.content);
      }
    } catch (err) {
      setSoulError("Failed to load SOUL.md");
    } finally {
      setSoulLoading(false);
    }
  }

  async function fetchTasks() {
    setTasksLoading(true);
    try {
      // Query tasks where category matches agent name or display name
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .or(`category.ilike.%${agent.name}%,category.ilike.%${agent.display_name}%`)
        .eq("archived", false)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setTasks(data || []);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setTasksLoading(false);
    }
  }

  async function fetchUpgrades() {
    setUpgradesLoading(true);
    try {
      // Query upgrades - in a real implementation, you might filter by agent
      const { data, error } = await supabase
        .from("upgrades")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setUpgrades(data || []);
    } catch (err) {
      console.error("Failed to fetch upgrades:", err);
    } finally {
      setUpgradesLoading(false);
    }
  }

  async function submitUpgradeSuggestion() {
    if (!upgradeSuggestion.trim()) return;

    setSubmittingUpgrade(true);
    try {
      const { error } = await supabase.from("upgrades").insert({
        title: `Upgrade for ${agent.display_name}`,
        description: upgradeSuggestion,
        status: "planned",
        priority: "medium",
        notes: `Suggested for agent: ${agent.name}`,
      });

      if (error) throw error;

      setUpgradeSuggestion("");
      fetchUpgrades();
    } catch (err) {
      console.error("Failed to submit upgrade:", err);
    } finally {
      setSubmittingUpgrade(false);
    }
  }

  const config = (agent.config || {}) as Record<string, unknown>;

  return (
    <div className="flex flex-col h-full max-h-[90vh]">
      {/* Header */}
      <DialogHeader className="p-6 pb-4 border-b border-border">
        <div className="flex items-center gap-4">
          <div
            className={`w-16 h-16 rounded-xl flex items-center justify-center text-3xl ${
              agent.status === "active"
                ? "bg-gradient-to-br from-accent to-accent/80"
                : agent.status === "idle"
                ? "bg-gradient-to-br from-yellow-500 to-yellow-600"
                : "bg-gradient-to-br from-zinc-600 to-zinc-700"
            }`}
          >
            {agent.avatar_emoji || "🤖"}
          </div>
          <div className="flex-1">
            <DialogTitle className="text-xl font-bold flex items-center gap-3">
              {agent.display_name}
              <Badge
                className={statusConfig[agent.status]?.color}
                variant="outline"
              >
                {statusConfig[agent.status]?.icon}
                <span className="ml-1">{agent.status}</span>
              </Badge>
            </DialogTitle>
            <p className="text-sm text-muted-foreground capitalize mt-1">
              {agent.type} Agent
            </p>
          </div>
        </div>
      </DialogHeader>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <TabsList className="mx-6 mt-4" variant="line">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="soul" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            SOUL
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <ListTodo className="w-4 h-4" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="upgrades" className="flex items-center gap-2">
            <Rocket className="w-4 h-4" />
            Upgrades
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden">
          {/* Overview Tab */}
          <TabsContent value="overview" className="h-full m-0">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-6">
                {agent.description && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Description
                    </h3>
                    <p className="text-sm">{agent.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-secondary/60 rounded-lg p-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Last Seen
                    </h3>
                    <p className="text-lg font-semibold">
                      <TimeAgo date={agent.last_seen_at} />
                    </p>
                  </div>
                  <div className="bg-secondary/60 rounded-lg p-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Status
                    </h3>
                    <p className="text-lg font-semibold capitalize">
                      {agent.status}
                    </p>
                  </div>
                </div>

                {config && Object.keys(config).length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      Configuration
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {config.session_count !== undefined && (
                        <div className="bg-secondary/60 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground">
                            Total Sessions
                          </p>
                          <p className="text-xl font-bold">
                            {String(config.session_count)}
                          </p>
                        </div>
                      )}
                      {config.sessions_today !== undefined && (
                        <div className="bg-secondary/60 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground">
                            Sessions Today
                          </p>
                          <p className="text-xl font-bold">
                            {String(config.sessions_today)}
                          </p>
                        </div>
                      )}
                      {Boolean(config.model) && (
                        <div className="bg-secondary/60 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground">Model</p>
                          <p className="text-sm font-mono truncate">
                            {String(config.model)}
                          </p>
                        </div>
                      )}
                      {Boolean(config.channel) && (
                        <div className="bg-secondary/60 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground">
                            Channel
                          </p>
                          <p className="text-sm capitalize">
                            {String(config.channel)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Agent ID
                  </h3>
                  <p className="text-xs font-mono bg-secondary/60 p-2 rounded break-all">
                    {agent.id}
                  </p>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* SOUL Tab */}
          <TabsContent value="soul" className="h-full m-0">
            <ScrollArea className="h-full">
              <div className="p-6">
                {soulLoading && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                )}
                {soulError && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="w-12 h-12 text-zinc-700 mb-4" />
                    <p className="text-muted-foreground text-sm">{soulError}</p>
                    <p className="text-xs text-zinc-600 mt-2">
                      Path: ~/.clawdbot/agents/{agent.name}/agent/SOUL.md
                    </p>
                  </div>
                )}
                {soulContent && (
                  <div className="prose prose-sm prose-invert max-w-none">
                    <ReactMarkdown
                      components={{
                        h1: ({ children }) => (
                          <h1 className="text-xl font-bold mb-4 text-foreground">
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-lg font-semibold mt-6 mb-3 text-foreground">
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-base font-medium mt-4 mb-2 text-foreground">
                            {children}
                          </h3>
                        ),
                        p: ({ children }) => (
                          <p className="text-muted-foreground mb-3 leading-relaxed">
                            {children}
                          </p>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc list-inside space-y-1 text-muted-foreground mb-4">
                            {children}
                          </ul>
                        ),
                        li: ({ children }) => (
                          <li className="text-sm">{children}</li>
                        ),
                        strong: ({ children }) => (
                          <strong className="font-semibold text-foreground">
                            {children}
                          </strong>
                        ),
                        code: ({ children }) => (
                          <code className="bg-secondary px-1.5 py-0.5 rounded text-xs font-mono text-accent">
                            {children}
                          </code>
                        ),
                        hr: () => <hr className="border-border my-6" />,
                      }}
                    >
                      {soulContent}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="h-full m-0">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-3">
                {tasksLoading && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                )}
                {!tasksLoading && tasks.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <ListTodo className="w-12 h-12 text-zinc-700 mb-4" />
                    <p className="text-muted-foreground text-sm">
                      No tasks assigned to this agent
                    </p>
                    <p className="text-xs text-zinc-600 mt-2">
                      Tasks with category matching &ldquo;{agent.name}&rdquo; will appear
                      here
                    </p>
                  </div>
                )}
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-secondary/60 rounded-lg p-4 border border-border/50 hover:border-border transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {task.column_id === "done" ? (
                          <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        )}
                        <span className="font-medium text-sm">{task.title}</span>
                      </div>
                      <Badge
                        className={`text-xs ${priorityColors[task.priority]}`}
                      >
                        {task.priority}
                      </Badge>
                    </div>
                    {task.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 ml-6">
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-3 ml-6">
                      <Badge variant="outline" className="text-xs">
                        {task.column_id.replace("_", " ")}
                      </Badge>
                      <span className="text-xs text-zinc-600">
                        {task.category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Upgrades Tab */}
          <TabsContent value="upgrades" className="h-full m-0">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-6">
                {/* Suggestion Form */}
                <div className="bg-secondary/60 rounded-lg p-4 border border-border/50">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    Suggest an Upgrade
                  </h3>
                  <Textarea
                    value={upgradeSuggestion}
                    onChange={(e) => setUpgradeSuggestion(e.target.value)}
                    placeholder={`Describe an improvement for ${agent.display_name}...`}
                    className="bg-card border-border min-h-[80px] mb-3"
                  />
                  <Button
                    onClick={submitUpgradeSuggestion}
                    disabled={!upgradeSuggestion.trim() || submittingUpgrade}
                    className="w-full"
                  >
                    {submittingUpgrade ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Submit Suggestion
                  </Button>
                </div>

                {/* Upgrades List */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Recent Upgrades
                  </h3>
                  {upgradesLoading && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  {!upgradesLoading && upgrades.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Rocket className="w-10 h-10 text-zinc-700 mb-3" />
                      <p className="text-muted-foreground text-sm">
                        No upgrades yet
                      </p>
                    </div>
                  )}
                  <div className="space-y-2">
                    {upgrades.map((upgrade) => (
                      <div
                        key={upgrade.id}
                        className="bg-secondary/60 rounded-lg p-3 border border-border/50"
                      >
                        <div className="flex items-start justify-between mb-1">
                          <span className="font-medium text-sm">
                            {upgrade.title}
                          </span>
                          <Badge
                            className={`text-xs ${
                              upgradeStatusColors[upgrade.status]
                            }`}
                          >
                            {upgrade.status.replace("_", " ")}
                          </Badge>
                        </div>
                        {upgrade.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {upgrade.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
