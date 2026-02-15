"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase, Call } from "@/lib/supabase";
import {
  Phone,
  PhoneOutgoing,
  Clock,
  User,
  Play,
  FileText,
  Plus,
  AlertCircle,
  PhoneMissed,
  PhoneCall,
} from "lucide-react";

const statusColors: Record<string, string> = {
  completed: "badge-active",
  failed: "badge-error",
  pending: "badge-warning",
  in_progress: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

function formatDuration(seconds: number | null): string {
  if (!seconds) return '0s';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

function formatTimestamp(date: string | null): string {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function LoadingSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="skeleton h-8 w-20 mb-2" />
          <div className="skeleton h-4 w-48" />
        </div>
        <div className="skeleton h-9 w-28 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton h-20 rounded-lg" />
        ))}
      </div>
      <div className="skeleton h-96 rounded-lg" />
    </div>
  );
}

export default function CallsPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCalls();
  }, []);

  async function fetchCalls() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('calls')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setCalls(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load calls');
    } finally {
      setLoading(false);
    }
  }

  const stats = {
    total: calls.length,
    completed: calls.filter(c => c.status === 'completed').length,
    totalDuration: calls.reduce((acc, c) => acc + (c.duration_seconds || 0), 0),
    failed: calls.filter(c => c.status === 'failed').length,
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">Calls</h1>
          <p className="text-muted-foreground text-sm">Phone calls made by Lex on your behalf</p>
        </div>
        <Button className="btn-primary-glow h-9 text-sm w-full md:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          New Call
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
                <p className="text-muted-foreground text-xs uppercase tracking-wider">Total Calls</p>
                <p className="text-2xl font-bold mt-0.5">{stats.total}</p>
              </div>
              <Phone className="w-8 h-8 text-primary/30" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border hero-stat card-glow animate-fade-in stagger-2 opacity-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider">Completed</p>
                <p className="text-2xl font-bold text-accent mt-0.5">{stats.completed}</p>
              </div>
              <PhoneOutgoing className="w-8 h-8 text-accent/30" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border hero-stat card-glow animate-fade-in stagger-3 opacity-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider">Total Duration</p>
                <p className="text-2xl font-bold font-terminal mt-0.5">{formatDuration(stats.totalDuration)}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border hero-stat card-glow animate-fade-in stagger-4 opacity-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider">Failed</p>
                <p className={`text-2xl font-bold mt-0.5 ${stats.failed > 0 ? 'text-red-400' : ''}`}>{stats.failed}</p>
              </div>
              <PhoneMissed className="w-8 h-8 text-red-500/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Call List */}
      <Card className="bg-card border-border card-glow animate-slide-up stagger-3 opacity-0">
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
            <PhoneCall className="w-4 h-4 text-primary" />
            Recent Calls
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          {calls.length === 0 ? (
            <div className="empty-state py-12">
              <Phone className="empty-state-icon" />
              <p className="empty-state-text">No calls yet</p>
            </div>
          ) : (
            calls.map((call, index) => (
              <div
                key={call.id}
                className="p-3 bg-secondary/60 rounded-lg border border-border/50 hover:border-border transition-all animate-fade-in opacity-0"
                style={{ animationDelay: `${0.2 + index * 0.05}s` }}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between mb-2 gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{call.to_name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground font-terminal">{call.to_number || 'No number'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 md:flex-col md:items-end">
                    <Badge className={statusColors[call.status] || statusColors.pending} variant="outline">
                      {call.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground">{formatTimestamp(call.started_at || call.created_at)}</p>
                  </div>
                </div>
                
                {call.purpose && (
                  <p className="text-xs text-muted-foreground mb-2 font-terminal">
                    <span className="text-muted-foreground">▶</span> {call.purpose}
                  </p>
                )}
                
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 font-terminal">
                      <Clock className="w-3 h-3" />
                      {formatDuration(call.duration_seconds)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {call.notes && (
                      <Button variant="outline" size="sm" className="bg-secondary border-border h-7 text-xs">
                        <FileText className="w-3 h-3 mr-1" />
                        Notes
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="bg-secondary border-border h-7 text-xs">
                      <Play className="w-3 h-3 mr-1" />
                      Listen
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
