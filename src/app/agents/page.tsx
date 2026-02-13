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
  Loader2,
  AlertCircle,
  ChevronRight,
  Zap,
  Terminal,
  MessageSquare,
  RefreshCw,
} from "lucide-react";

const statusColors: Record<string, string> = {
  active: "bg-green-500/20 text-green-400 border-green-500/30",
  idle: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  complete: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  error: "bg-red-500/20 text-red-400 border-red-500/30",
};

const statusIcons: Record<string, React.ReactNode> = {
  active: <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />,
  idle: <div className="w-2 h-2 rounded-full bg-zinc-500" />,
  complete: <div className="w-2 h-2 rounded-full bg-blue-500" />,
  error: <div className="w-2 h-2 rounded-full bg-red-500" />,
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

function timeAgo(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
  
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
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
    const interval = setInterval(fetchAgents, 10000); // Refresh every 10s
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

      // Fetch recent logs for each agent
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
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const activeCount = agents.filter(a => a.status === 'active').length;
  const totalLogs = Object.values(recentLogs).flat().length;

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Agents</h1>
          <p className="text-zinc-400">Monitor all active and idle agents</p>
        </div>
        <Button onClick={fetchAgents} variant="outline" className="bg-zinc-800 border-zinc-700">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Total Agents</p>
                <p className="text-2xl font-bold">{agents.length}</p>
              </div>
              <Bot className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Active</p>
                <p className="text-2xl font-bold text-green-400">{activeCount}</p>
              </div>
              <Activity className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Idle</p>
                <p className="text-2xl font-bold">{agents.filter(a => a.status === 'idle').length}</p>
              </div>
              <Clock className="w-8 h-8 text-zinc-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Actions (recent)</p>
                <p className="text-2xl font-bold">{totalLogs}</p>
              </div>
              <Zap className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold mb-4">All Agents</h2>
          {agents.map((agent) => (
            <Card 
              key={agent.id} 
              className={`bg-zinc-900 border-zinc-800 cursor-pointer transition-all hover:border-zinc-700 ${selectedAgent?.id === agent.id ? 'border-amber-500/50' : ''}`}
              onClick={() => setSelectedAgent(agent)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-zinc-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{agent.label}</h3>
                        {statusIcons[agent.status]}
                      </div>
                      <p className="text-xs text-zinc-500 font-mono">{agent.session_key}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusColors[agent.status]}>
                      {agent.status}
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                  </div>
                </div>

                {agent.current_task && (
                  <p className="text-sm text-zinc-300 mb-3 bg-zinc-800/50 p-2 rounded">
                    <span className="text-zinc-500">Task:</span> {agent.current_task}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <div className="flex items-center gap-4">
                    {agent.model && <span className="bg-zinc-800 px-2 py-0.5 rounded">{agent.model}</span>}
                    {agent.channel && <span className="bg-zinc-800 px-2 py-0.5 rounded">{agent.channel}</span>}
                  </div>
                  <span>Active {timeAgo(agent.last_active_at)}</span>
                </div>

                {/* Recent activity preview */}
                {recentLogs[agent.id]?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-zinc-800">
                    <p className="text-xs text-zinc-500 mb-2">Recent Activity</p>
                    <div className="space-y-1">
                      {recentLogs[agent.id].slice(0, 2).map((log) => (
                        <div key={log.id} className="flex items-center gap-2 text-xs">
                          <span className="text-zinc-600">{categoryIcons[log.action_category]}</span>
                          <span className="text-zinc-400 truncate">{log.action_type}</span>
                          <span className="text-zinc-600 ml-auto">{timeAgo(log.timestamp)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {agents.length === 0 && (
            <Card className="bg-zinc-900 border-zinc-800 p-8 text-center">
              <p className="text-zinc-400">No agents found</p>
            </Card>
          )}
        </div>

        {/* Agent Detail Panel */}
        <div className="lg:col-span-1">
          <h2 className="text-lg font-semibold mb-4">
            {selectedAgent ? 'Agent Details' : 'Select an Agent'}
          </h2>
          {selectedAgent ? (
            <Card className="bg-zinc-900 border-zinc-800 sticky top-4">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{selectedAgent.label}</CardTitle>
                    <Badge className={statusColors[selectedAgent.status]}>
                      {selectedAgent.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Session Key</p>
                  <p className="text-sm font-mono bg-zinc-800 p-2 rounded break-all">{selectedAgent.session_key}</p>
                </div>
                
                {selectedAgent.current_task && (
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Current Task</p>
                    <p className="text-sm">{selectedAgent.current_task}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Model</p>
                    <p className="text-sm">{selectedAgent.model || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Channel</p>
                    <p className="text-sm">{selectedAgent.channel || 'Unknown'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-zinc-500 mb-1">Created</p>
                  <p className="text-sm">{new Date(selectedAgent.created_at).toLocaleString()}</p>
                </div>

                {/* Activity Stream */}
                <div>
                  <p className="text-xs text-zinc-500 mb-2">Activity Stream</p>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {agentLogs.map((log) => (
                      <div key={log.id} className="p-2 bg-zinc-800/50 rounded text-xs">
                        <div className="flex items-center gap-2 mb-1">
                          {categoryIcons[log.action_category]}
                          <span className="font-medium">{log.action_type}</span>
                          <span className={`ml-auto ${log.success ? 'text-green-400' : 'text-red-400'}`}>
                            {log.success ? '✓' : '✗'}
                          </span>
                        </div>
                        <p className="text-zinc-500">{timeAgo(log.timestamp)}</p>
                        {log.duration_ms && (
                          <p className="text-zinc-600">{log.duration_ms}ms</p>
                        )}
                      </div>
                    ))}
                    {agentLogs.length === 0 && (
                      <p className="text-zinc-500 text-center py-4">No activity yet</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-zinc-900 border-zinc-800 p-8 text-center">
              <Bot className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-400">Click on an agent to view details</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
