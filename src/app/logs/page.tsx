"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase, Agent, ActivityLog, ActionCategory } from "@/lib/supabase";
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  AlertCircle,
  Terminal,
  FileText,
  MessageSquare,
  Globe,
  Bot,
  Activity,
  Settings,
  ChevronDown,
  ChevronUp,
  X,
  Calendar,
  CheckCircle,
  XCircle,
} from "lucide-react";

const categoryColors: Record<ActionCategory, string> = {
  tool: "bg-purple-500/20 text-purple-400",
  message: "bg-blue-500/20 text-blue-400",
  file: "bg-accent/20 text-accent",
  exec: "bg-primary/20 text-primary",
  browser: "bg-pink-500/20 text-pink-400",
  api: "bg-cyan-500/20 text-cyan-400",
  system: "bg-zinc-500/20 text-muted-foreground",
};

const categoryIcons: Record<ActionCategory, React.ReactNode> = {
  tool: <Bot className="w-4 h-4" />,
  message: <MessageSquare className="w-4 h-4" />,
  file: <FileText className="w-4 h-4" />,
  exec: <Terminal className="w-4 h-4" />,
  browser: <Globe className="w-4 h-4" />,
  api: <Activity className="w-4 h-4" />,
  system: <Settings className="w-4 h-4" />,
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
      <div className="flex justify-between items-center">
        <div>
          <div className="skeleton h-8 w-40 mb-2" />
          <div className="skeleton h-4 w-56" />
        </div>
        <div className="flex gap-2">
          <div className="skeleton h-9 w-24 rounded-lg" />
          <div className="skeleton h-9 w-16 rounded-lg" />
        </div>
      </div>
      <div className="skeleton h-14 rounded-lg" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton h-16 rounded-lg" />
        ))}
      </div>
      <div className="skeleton h-96 rounded-lg" />
    </div>
  );
}

export default function LogsPage() {
  const [logs, setLogs] = useState<(ActivityLog & { agent?: Agent })[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [dateRange, setDateRange] = useState<"all" | "today" | "week" | "month">("all");
  const [showFilters, setShowFilters] = useState(false);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 50;

  const fetchLogs = useCallback(async (reset = false) => {
    try {
      if (reset) {
        setPage(0);
        setLogs([]);
      }
      
      setLoading(true);
      
      let query = supabase
        .from('activity_logs')
        .select('*, agent:agents(*)')
        .order('timestamp', { ascending: false })
        .range(reset ? 0 : page * pageSize, (reset ? 0 : page) * pageSize + pageSize - 1);

      if (selectedAgent !== "all") {
        query = query.eq('agent_id', selectedAgent);
      }
      
      if (selectedCategory !== "all") {
        query = query.eq('action_category', selectedCategory);
      }

      if (dateRange !== "all") {
        const now = new Date();
        let startDate: Date;
        switch (dateRange) {
          case "today":
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
          case "week":
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case "month":
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
        }
        query = query.gte('timestamp', startDate.toISOString());
      }

      const { data, error: fetchError } = await query;
      
      if (fetchError) throw fetchError;
      
      const newLogs = data || [];
      setHasMore(newLogs.length === pageSize);
      
      if (reset) {
        setLogs(newLogs);
      } else {
        setLogs(prev => [...prev, ...newLogs]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  }, [page, selectedAgent, selectedCategory, dateRange]);

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    fetchLogs(true);
  }, [selectedAgent, selectedCategory, dateRange]);

  async function fetchAgents() {
    const { data } = await supabase.from('agents').select('*').order('label');
    setAgents(data || []);
  }

  function loadMore() {
    setPage(p => p + 1);
    fetchLogs(false);
  }

  function exportLogs(format: 'csv' | 'json') {
    const filteredLogs = logs.filter(log => {
      if (searchQuery) {
        const search = searchQuery.toLowerCase();
        return (
          log.action_type.toLowerCase().includes(search) ||
          JSON.stringify(log.details).toLowerCase().includes(search) ||
          (log.result?.toLowerCase().includes(search))
        );
      }
      return true;
    });

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(filteredLogs, null, 2)], { type: 'application/json' });
      downloadBlob(blob, 'activity_logs.json');
    } else {
      const headers = ['timestamp', 'agent', 'action_type', 'category', 'success', 'duration_ms', 'result'];
      const rows = filteredLogs.map(log => [
        log.timestamp,
        log.agent?.label || 'Unknown',
        log.action_type,
        log.action_category,
        log.success ? 'true' : 'false',
        log.duration_ms?.toString() || '',
        log.result || '',
      ]);
      const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      downloadBlob(blob, 'activity_logs.csv');
    }
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      log.action_type.toLowerCase().includes(search) ||
      JSON.stringify(log.details).toLowerCase().includes(search) ||
      (log.result?.toLowerCase().includes(search)) ||
      (log.agent?.label.toLowerCase().includes(search))
    );
  });

  const categories: ActionCategory[] = ['tool', 'message', 'file', 'exec', 'browser', 'api', 'system'];
  const successCount = filteredLogs.filter(l => l.success).length;
  const successRate = filteredLogs.length > 0 ? Math.round((successCount / filteredLogs.length) * 100) : 0;

  if (loading && logs.length === 0) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">Activity Logs</h1>
          <p className="text-muted-foreground text-sm">Full audit trail of all agent actions</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => fetchLogs(true)} variant="outline" className="bg-secondary border-border hover:bg-secondary h-9 text-sm">
            <RefreshCw className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Refresh</span>
          </Button>
          <Button onClick={() => exportLogs('csv')} variant="outline" className="bg-secondary border-border hover:bg-secondary h-9 text-sm">
            <Download className="w-4 h-4 md:mr-1" />
            <span className="hidden md:inline">CSV</span>
          </Button>
          <Button onClick={() => exportLogs('json')} variant="outline" className="bg-secondary border-border hover:bg-secondary h-9 text-sm">
            <Download className="w-4 h-4 md:mr-1" />
            <span className="hidden md:inline">JSON</span>
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

      {/* Search and Filters */}
      <Card className="bg-card border-border mb-4 animate-fade-in stagger-1 opacity-0">
        <CardContent className="p-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-secondary border-border h-9 text-sm font-terminal"
              />
            </div>
            
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
              className="bg-secondary border-border h-9 text-sm"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {showFilters ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
            </Button>
          </div>

          {showFilters && (
            <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wider">Agent</label>
                <select
                  value={selectedAgent}
                  onChange={(e) => setSelectedAgent(e.target.value)}
                  className="w-full p-2 bg-secondary border border-border rounded-lg text-sm"
                >
                  <option value="all">All Agents</option>
                  {agents.map(agent => (
                    <option key={agent.id} value={agent.id}>{agent.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wider">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-2 bg-secondary border border-border rounded-lg text-sm"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wider">Date Range</label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
                  className="w-full p-2 bg-secondary border border-border rounded-lg text-sm"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Past Week</option>
                  <option value="month">Past Month</option>
                </select>
              </div>
            </div>
          )}

          {(selectedAgent !== "all" || selectedCategory !== "all" || dateRange !== "all" || searchQuery) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedAgent !== "all" && (
                <Badge className="bg-secondary text-zinc-300 gap-1 text-xs">
                  Agent: {agents.find(a => a.id === selectedAgent)?.label}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedAgent("all")} />
                </Badge>
              )}
              {selectedCategory !== "all" && (
                <Badge className="bg-secondary text-zinc-300 gap-1 text-xs">
                  Category: {selectedCategory}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedCategory("all")} />
                </Badge>
              )}
              {dateRange !== "all" && (
                <Badge className="bg-secondary text-zinc-300 gap-1 text-xs">
                  Date: {dateRange}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setDateRange("all")} />
                </Badge>
              )}
              {searchQuery && (
                <Badge className="bg-secondary text-zinc-300 gap-1 text-xs font-terminal">
                  Search: "{searchQuery}"
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchQuery("")} />
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Card className="bg-card border-border animate-fade-in stagger-2 opacity-0">
          <CardContent className="p-3">
            <p className="text-muted-foreground text-xs uppercase tracking-wider">Total Logs</p>
            <p className="text-xl font-bold mt-0.5">{filteredLogs.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border animate-fade-in stagger-3 opacity-0">
          <CardContent className="p-3">
            <p className="text-muted-foreground text-xs uppercase tracking-wider">Success Rate</p>
            <p className={`text-xl font-bold mt-0.5 ${successRate >= 90 ? 'text-accent' : successRate >= 70 ? 'text-primary' : 'text-red-400'}`}>
              {successRate}%
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border animate-fade-in stagger-4 opacity-0">
          <CardContent className="p-3">
            <p className="text-muted-foreground text-xs uppercase tracking-wider">Unique Agents</p>
            <p className="text-xl font-bold mt-0.5">{new Set(filteredLogs.map(l => l.agent_id)).size}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border animate-fade-in stagger-5 opacity-0">
          <CardContent className="p-3">
            <p className="text-muted-foreground text-xs uppercase tracking-wider">Avg Duration</p>
            <p className="text-xl font-bold font-terminal mt-0.5">
              {filteredLogs.length > 0 
                ? Math.round(filteredLogs.reduce((acc, l) => acc + (l.duration_ms || 0), 0) / filteredLogs.filter(l => l.duration_ms).length || 0)
                : 0}ms
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Logs List */}
      <Card className="bg-card border-border animate-slide-up stagger-3 opacity-0">
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Terminal className="w-4 h-4 text-accent" />
            Activity Stream
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredLogs.length === 0 ? (
            <div className="empty-state py-12">
              <Terminal className="empty-state-icon" />
              <p className="empty-state-text">No logs found</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredLogs.map((log, index) => (
                <div 
                  key={log.id} 
                  className="p-3 hover:bg-secondary/40 transition-colors cursor-pointer log-entry"
                  onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                  style={{ animationDelay: `${Math.min(index * 0.02, 0.5)}s` }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${categoryColors[log.action_category]}`}>
                      {categoryIcons[log.action_category]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm font-terminal">{log.action_type}</span>
                        <Badge className={`${categoryColors[log.action_category]} text-xs`} variant="outline">
                          {log.action_category}
                        </Badge>
                        {log.success ? (
                          <span className="flex items-center gap-1 text-xs text-accent">
                            <CheckCircle className="w-3 h-3" />
                            <span className="hidden sm:inline">Success</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-red-400">
                            <XCircle className="w-3 h-3" />
                            <span className="hidden sm:inline">Failed</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Bot className="w-3 h-3" />
                          {log.agent?.label || 'Unknown Agent'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <TimeAgo date={log.timestamp} />
                        </span>
                        {log.duration_ms && (
                          <span className="font-terminal">{log.duration_ms}ms</span>
                        )}
                      </div>
                      
                      {expandedLog === log.id && (
                        <div className="mt-3 p-3 bg-secondary rounded-lg text-sm border border-border/50 animate-fade-in-scale">
                          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Details</p>
                          <pre className="text-xs overflow-x-auto whitespace-pre-wrap text-muted-foreground font-terminal bg-card/50 p-2 rounded">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                          {log.result && (
                            <>
                              <p className="text-xs text-muted-foreground mt-3 mb-2 uppercase tracking-wider">Result</p>
                              <p className="text-muted-foreground text-sm font-terminal">{log.result}</p>
                            </>
                          )}
                          <p className="text-xs text-muted-foreground mt-3 font-terminal">
                            {new Date(log.timestamp).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {hasMore && !loading && filteredLogs.length > 0 && (
            <div className="p-4 text-center border-t border-border/50">
              <Button onClick={loadMore} variant="outline" className="bg-secondary border-border h-9 text-sm">
                Load More
              </Button>
            </div>
          )}
          
          {loading && logs.length > 0 && (
            <div className="p-4 text-center border-t border-border/50">
              <div className="skeleton h-5 w-5 mx-auto rounded-full" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
