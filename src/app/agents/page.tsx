"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase, Agent, ActivityLog } from "@/lib/supabase";
import {
  Bot,
  Activity,
  Clock,
  AlertCircle,
  ChevronRight,
  Zap,
  Terminal,
  MessageSquare,
  RefreshCw,
  Cpu,
} from "lucide-react";

const statusColors: Record<string, string> = {
  active: "badge-active",
  idle: "badge-warning",
  complete: "text-muted-foreground border-border",
  error: "badge-error",
};

const categoryIcons: Record<string, React.ReactNode> = {
  exec: <Terminal className="w-3 h-3" />,
  file: <Activity className="w-3 h-3" />,
  message: <MessageSquare className="w-3 h-3" />,
  browser: <Zap className="w-3 h-3" />,
  tool: <Bot className="w-3 h-3" />,
  api: <Activity className="w-3 h-3" />,
  system: <Activity className="w-3 h-3" />,
};

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
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton h-20 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton h-32 rounded-lg" />
          ))}
        </div>
        <div className="skeleton h-96 rounded-lg" />
      </div>
    </div>
  );
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [recentLogs, setRecentLogs] = useState<Record<string, ActivityLog[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [agentLogs, setAgentLogs] = useState<ActivityLog[]>([]);

  useEffect(() => {
    fetchAgents();
    const interval = setInterval(fetchAgents, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedAgent) {
      fetchAgentLogs(selectedAgent.id);
    }
  }, [selectedAgent]);

  async function fetchAgents() {
    try {
      const { data: agentsData, error: agentsError } = await supabase
        .from('agents')
        .select('*')
        .order('last_active_at', { ascending: false });
      
      if (agentsError) throw agentsError;
      setAgents(agentsData || []);

      const logsMap: Record<string, ActivityLog[]> = {};
      for (const agent of agentsData || []) {
        const { data: logs } = await supabase
          .from('activity_logs')
          .select('*')
          .eq('agent_id', agent.id)
          .order('timestamp', { ascending: false })
          .limit(3);
        logsMap[agent.id] = logs || [];
      }
      setRecentLogs(logsMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agents');
    } finally {
      setLoading(false);
    }
  }

  async function fetchAgentLogs(agentId: string) {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('agent_id', agentId)
      .order('timestamp', { ascending: false })
      .limit(50);
    
    if (!error) {
      setAgentLogs(data || []);
    }
  }

  if (loading) {
    return <LoadingSkeleton />;
  }

  const activeCount = agents.filter(a => a.status === 'active').length;
  const idleCount = agents.filter(a => a.status === 'idle').length;
  const totalLogs = Object.values(recentLogs).flat().length;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">Agents</h1>
          <p className="text-muted-foreground text-sm">Monitor all active and idle agents</p>
        </div>
        <Button onClick={fetchAgents} variant="outline" className="bg-secondary border-border hover:bg-secondary h-9 text-sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="bg-card border-border hero-stat card-glow animate-fade-in stagger-1 opacity-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider">Total Agents</p>
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
                <p className="text-muted-foreground text-xs uppercase tracking-wider">Active</p>
                <p className="text-2xl font-bold text-accent mt-1">{activeCount}</p>
              </div>
              <div className="relative">
                <Activity className="w-8 h-8 text-accent/30" />
                {activeCount > 0 && <span className="absolute -top-1 -right-1 status-dot status-dot-active" />}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border hero-stat card-glow animate-fade-in stagger-3 opacity-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider">Idle</p>
                <p className="text-2xl font-bold text-primary mt-1">{idleCount}</p>
              </div>
              <Clock className="w-8 h-8 text-primary/30" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border hero-stat card-glow animate-fade-in stagger-4 opacity-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider">Actions</p>
                <p className="text-2xl font-bold mt-1">{totalLogs}</p>
              </div>
              <Zap className="w-8 h-8 text-purple-500/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Agent List */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 animate-fade-in">All Agents</h2>
          {agents.map((agent, index) => (
            <Card 
              key={agent.id} 
              className={`bg-card border-border cursor-pointer transition-all card-glow animate-fade-in opacity-0 ${selectedAgent?.id === agent.id ? 'border-primary/50 ring-1 ring-primary/20' : ''}`}
              onClick={() => setSelectedAgent(agent)}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      agent.status === 'active' ? 'bg-accent/10' : 'bg-secondary'
                    }`}>
                      <Cpu className={`w-5 h-5 ${agent.status === 'active' ? 'text-accent' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">{agent.label}</h3>
                        <span className={`status-dot ${
                          agent.status === 'active' ? 'status-dot-active' :
                          agent.status === 'idle' ? 'status-dot-idle' :
                          agent.status === 'error' ? 'status-dot-error' : 'status-dot-complete'
                        }`} />
                      </div>
                      <p className="text-xs text-muted-foreground font-terminal">{agent.session_key}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusColors[agent.status]} variant="outline">
                      {agent.status}
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>

                {agent.current_task && (
                  <p className="text-sm text-muted-foreground mb-3 bg-secondary p-2 rounded font-terminal text-xs">
                    <span className="text-muted-foreground">▶</span> {agent.current_task}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2 flex-wrap">
                    {agent.model && <span className="bg-secondary px-2 py-0.5 rounded font-terminal">{agent.model}</span>}
                    {agent.channel && <span className="bg-secondary px-2 py-0.5 rounded">{agent.channel}</span>}
                  </div>
                  <span>Active <TimeAgo date={agent.last_active_at} /></span>
                </div>

                {/* Recent activity preview */}
                {recentLogs[agent.id]?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Recent</p>
                    <div className="space-y-1">
                      {recentLogs[agent.id].slice(0, 2).map((log) => (
                        <div key={log.id} className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground">{categoryIcons[log.action_category]}</span>
                          <span className="text-muted-foreground truncate font-terminal">{log.action_type}</span>
                          <span className={`w-1 h-1 rounded-full ml-auto ${log.success ? 'bg-accent' : 'bg-red-500'}`} />
                          <span className="text-zinc-700"><TimeAgo date={log.timestamp} /></span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {agents.length === 0 && (
            <Card className="bg-card border-border animate-fade-in">
              <CardContent className="empty-state">
                <Bot className="empty-state-icon" />
                <p className="empty-state-text">No agents found</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Agent Detail Panel */}
        <div className="lg:col-span-1">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 animate-fade-in">
            {selectedAgent ? 'Agent Details' : 'Select an Agent'}
          </h2>
          {selectedAgent ? (
            <Card className="bg-card border-border sticky top-4 card-glow animate-slide-in-right">
              <CardHeader className="pb-3 px-4 pt-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    selectedAgent.status === 'active' 
                      ? 'bg-gradient-to-br from-accent to-accent/80' 
                      : 'bg-gradient-to-br from-primary to-accent'
                  }`}>
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{selectedAgent.label}</CardTitle>
                    <Badge className={statusColors[selectedAgent.status]} variant="outline">
                      {selectedAgent.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 px-4 pb-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Session Key</p>
                  <p className="text-xs font-terminal bg-secondary p-2 rounded break-all text-muted-foreground">{selectedAgent.session_key}</p>
                </div>
                
                {selectedAgent.current_task && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Current Task</p>
                    <p className="text-sm font-terminal">{selectedAgent.current_task}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Model</p>
                    <p className="text-sm font-terminal">{selectedAgent.model || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Channel</p>
                    <p className="text-sm">{selectedAgent.channel || 'Unknown'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Created</p>
                  <p className="text-sm">{new Date(selectedAgent.created_at).toLocaleString()}</p>
                </div>

                {/* Activity Stream */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Activity Stream</p>
                  <div className="max-h-52 overflow-y-auto space-y-1.5 activity-stream">
                    {agentLogs.map((log) => (
                      <div key={log.id} className="p-2 bg-secondary/60 rounded text-xs border border-border/50 log-entry">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-muted-foreground">{categoryIcons[log.action_category]}</span>
                          <span className="font-terminal text-zinc-300 truncate">{log.action_type}</span>
                          <span className={`ml-auto flex-shrink-0 ${log.success ? 'text-accent' : 'text-red-400'}`}>
                            {log.success ? '✓' : '✗'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span><TimeAgo date={log.timestamp} /></span>
                          {log.duration_ms && <span className="font-terminal">{log.duration_ms}ms</span>}
                        </div>
                      </div>
                    ))}
                    {agentLogs.length === 0 && (
                      <p className="text-muted-foreground text-center py-4 text-xs">No activity yet</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-border animate-fade-in">
              <CardContent className="empty-state">
                <Bot className="empty-state-icon" />
                <p className="empty-state-text">Click on an agent to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
