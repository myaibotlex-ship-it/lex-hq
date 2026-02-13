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
  Loader2,
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
} from "lucide-react";

const categoryColors: Record<ActionCategory, string> = {
  tool: "bg-purple-500/20 text-purple-400",
  message: "bg-blue-500/20 text-blue-400",
  file: "bg-green-500/20 text-green-400",
  exec: "bg-amber-500/20 text-amber-400",
  browser: "bg-pink-500/20 text-pink-400",
  api: "bg-cyan-500/20 text-cyan-400",
  system: "bg-zinc-500/20 text-zinc-400",
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

function timeAgo(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
  
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<(ActivityLog & { agent?: Agent })[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [dateRange, setDateRange] = useState<"all" | "today" | "week" | "month">("all");
  const [showFilters, setShowFilters] = useState(false);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  // Pagination
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

      // Apply filters
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

  // Filter logs by search query
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

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Activity Logs</h1>
          <p className="text-zinc-400">Full audit trail of all agent actions</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => fetchLogs(true)} variant="outline" className="bg-zinc-800 border-zinc-700">
            <RefreshCw className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Refresh</span>
          </Button>
          <Button onClick={() => exportLogs('csv')} variant="outline" className="bg-zinc-800 border-zinc-700">
            <Download className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">CSV</span>
          </Button>
          <Button onClick={() => exportLogs('json')} variant="outline" className="bg-zinc-800 border-zinc-700">
            <Download className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">JSON</span>
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

      {/* Search and Filters */}
      <Card className="bg-zinc-900 border-zinc-800 mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-zinc-800 border-zinc-700"
              />
            </div>
            
            {/* Filter Toggle */}
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
              className="bg-zinc-800 border-zinc-700"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {showFilters ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
            </Button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-zinc-800 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Agent Filter */}
              <div>
                <label className="text-xs text-zinc-500 mb-2 block">Agent</label>
                <select
                  value={selectedAgent}
                  onChange={(e) => setSelectedAgent(e.target.value)}
                  className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm"
                >
                  <option value="all">All Agents</option>
                  {agents.map(agent => (
                    <option key={agent.id} value={agent.id}>{agent.label}</option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="text-xs text-zinc-500 mb-2 block">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="text-xs text-zinc-500 mb-2 block">Date Range</label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
                  className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Past Week</option>
                  <option value="month">Past Month</option>
                </select>
              </div>
            </div>
          )}

          {/* Active Filters */}
          {(selectedAgent !== "all" || selectedCategory !== "all" || dateRange !== "all" || searchQuery) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedAgent !== "all" && (
                <Badge className="bg-zinc-800 text-zinc-300 gap-1">
                  Agent: {agents.find(a => a.id === selectedAgent)?.label}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedAgent("all")} />
                </Badge>
              )}
              {selectedCategory !== "all" && (
                <Badge className="bg-zinc-800 text-zinc-300 gap-1">
                  Category: {selectedCategory}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedCategory("all")} />
                </Badge>
              )}
              {dateRange !== "all" && (
                <Badge className="bg-zinc-800 text-zinc-300 gap-1">
                  Date: {dateRange}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setDateRange("all")} />
                </Badge>
              )}
              {searchQuery && (
                <Badge className="bg-zinc-800 text-zinc-300 gap-1">
                  Search: "{searchQuery}"
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchQuery("")} />
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-3">
            <p className="text-zinc-400 text-xs">Total Logs</p>
            <p className="text-xl font-bold">{filteredLogs.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-3">
            <p className="text-zinc-400 text-xs">Success Rate</p>
            <p className="text-xl font-bold text-green-400">
              {filteredLogs.length > 0 
                ? Math.round((filteredLogs.filter(l => l.success).length / filteredLogs.length) * 100)
                : 0}%
            </p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-3">
            <p className="text-zinc-400 text-xs">Unique Agents</p>
            <p className="text-xl font-bold">{new Set(filteredLogs.map(l => l.agent_id)).size}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-3">
            <p className="text-zinc-400 text-xs">Avg Duration</p>
            <p className="text-xl font-bold">
              {filteredLogs.length > 0 
                ? Math.round(filteredLogs.reduce((acc, l) => acc + (l.duration_ms || 0), 0) / filteredLogs.filter(l => l.duration_ms).length || 0)
                : 0}ms
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Logs List */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Activity Stream</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading && logs.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-zinc-400">
              No logs found
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {filteredLogs.map((log) => (
                <div 
                  key={log.id} 
                  className="p-4 hover:bg-zinc-800/30 transition-colors cursor-pointer"
                  onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${categoryColors[log.action_category]}`}>
                      {categoryIcons[log.action_category]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{log.action_type}</span>
                        <Badge className={categoryColors[log.action_category]} variant="outline">
                          {log.action_category}
                        </Badge>
                        <Badge className={log.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                          {log.success ? 'Success' : 'Failed'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Bot className="w-3 h-3" />
                          {log.agent?.label || 'Unknown Agent'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {timeAgo(log.timestamp)}
                        </span>
                        {log.duration_ms && (
                          <span>{log.duration_ms}ms</span>
                        )}
                      </div>
                      
                      {/* Expanded Details */}
                      {expandedLog === log.id && (
                        <div className="mt-3 p-3 bg-zinc-800/50 rounded-lg text-sm">
                          <p className="text-xs text-zinc-500 mb-2">Details</p>
                          <pre className="text-xs overflow-x-auto whitespace-pre-wrap text-zinc-300 font-mono">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                          {log.result && (
                            <>
                              <p className="text-xs text-zinc-500 mt-3 mb-2">Result</p>
                              <p className="text-zinc-300">{log.result}</p>
                            </>
                          )}
                          <p className="text-xs text-zinc-500 mt-3">
                            Timestamp: {new Date(log.timestamp).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Load More */}
          {hasMore && !loading && filteredLogs.length > 0 && (
            <div className="p-4 text-center border-t border-zinc-800">
              <Button onClick={loadMore} variant="outline" className="bg-zinc-800 border-zinc-700">
                Load More
              </Button>
            </div>
          )}
          
          {loading && logs.length > 0 && (
            <div className="p-4 text-center border-t border-zinc-800">
              <Loader2 className="w-5 h-5 animate-spin text-amber-500 mx-auto" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
