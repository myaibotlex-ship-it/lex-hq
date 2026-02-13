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
  Loader2,
  AlertCircle,
  PhoneMissed,
} from "lucide-react";

const statusColors: Record<string, string> = {
  completed: "bg-green-500/20 text-green-400",
  failed: "bg-red-500/20 text-red-400",
  pending: "bg-amber-500/20 text-amber-400",
  in_progress: "bg-blue-500/20 text-blue-400",
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
  };

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
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Calls</h1>
          <p className="text-zinc-400">Phone calls made by Lex on your behalf</p>
        </div>
        <Button className="bg-amber-600 hover:bg-amber-700 w-full md:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          New Call
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
                <p className="text-zinc-400 text-sm">Total Calls</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Phone className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Completed</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
              <PhoneOutgoing className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Total Duration</p>
                <p className="text-2xl font-bold">{formatDuration(stats.totalDuration)}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Failed</p>
                <p className="text-2xl font-bold">{calls.filter(c => c.status === 'failed').length}</p>
              </div>
              <PhoneMissed className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Call List */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle>Recent Calls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {calls.length === 0 ? (
            <p className="text-center text-zinc-400 py-8">No calls yet</p>
          ) : (
            calls.map((call) => (
              <div
                key={call.id}
                className="p-4 bg-zinc-800 rounded-lg border border-zinc-700 hover:border-zinc-600 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between mb-3 gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-zinc-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{call.to_name || 'Unknown'}</p>
                      <p className="text-sm text-zinc-400">{call.to_number || 'No number'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 md:flex-col md:items-end">
                    <Badge className={statusColors[call.status] || statusColors.pending}>
                      {call.status}
                    </Badge>
                    <p className="text-xs text-zinc-500">{formatTimestamp(call.started_at || call.created_at)}</p>
                  </div>
                </div>
                
                {call.purpose && (
                  <p className="text-sm text-zinc-300 mb-3">
                    <span className="text-zinc-500">Purpose:</span> {call.purpose}
                  </p>
                )}
                
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                  <div className="flex items-center gap-4 text-sm text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDuration(call.duration_seconds)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {call.notes && (
                      <Button variant="outline" size="sm" className="bg-zinc-700 border-zinc-600 h-8 text-xs">
                        <FileText className="w-4 h-4 mr-1" />
                        Notes
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="bg-zinc-700 border-zinc-600 h-8 text-xs">
                      <Play className="w-4 h-4 mr-1" />
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
