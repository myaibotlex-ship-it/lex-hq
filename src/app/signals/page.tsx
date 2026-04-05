'use client';

import { useState, useEffect } from 'react';

interface Signal {
  id: string;
  company_name: string;
  website: string;
  current_provider: string;
  provider_type: string;
  confidence: string;
  source: string;
  evidence: string;
  signal_type: string;
  status: string;
  created_at: string;
}

const SIGNAL_TYPES = ['frustration', 'job_posting', 'implementation', 'review', 'discussion', 'case_study'];
const PROVIDERS = ['RingCentral', '8x8', 'Vonage', 'Five9', 'Genesys', 'Talkdesk', 'Dialpad', 'GoTo'];

export default function SignalsPage() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ signalType: '', provider: '', status: '' });

  useEffect(() => {
    fetchSignals();
    const interval = setInterval(fetchSignals, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [filters]);

  const fetchSignals = async () => {
    const params = new URLSearchParams();
    if (filters.provider) params.set('provider', filters.provider);
    if (filters.status) params.set('status', filters.status);
    
    const res = await fetch(`/api/prospects?${params}`);
    let data = await res.json();
    
    if (filters.signalType) {
      data = data.filter((s: Signal) => s.signal_type === filters.signalType);
    }
    
    setSignals(data);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/prospects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchSignals();
  };

  const getSignalIcon = (type: string) => {
    switch (type) {
      case 'frustration': return '😤';
      case 'job_posting': return '💼';
      case 'implementation': return '🚀';
      case 'review': return '⭐';
      case 'discussion': return '💬';
      case 'case_study': return '📄';
      default: return '📡';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'qualified': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const todayCount = signals.filter(s => {
    const created = new Date(s.created_at);
    const today = new Date();
    return created.toDateString() === today.toDateString();
  }).length;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">📡 Signal Feed</h1>
            <p className="text-gray-400 text-sm">Live UCaaS/CCaaS prospect signals</p>
          </div>
          <div className="mt-2 md:mt-0 flex items-center gap-4">
            <span className="text-green-400 animate-pulse">● Live</span>
            <span className="text-gray-400">{todayCount} signals today</span>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              value={filters.signalType}
              onChange={e => setFilters({ ...filters, signalType: e.target.value })}
            >
              <option value="">All Signal Types</option>
              {SIGNAL_TYPES.map(t => <option key={t} value={t}>{getSignalIcon(t)} {t}</option>)}
            </select>
            <select
              className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              value={filters.provider}
              onChange={e => setFilters({ ...filters, provider: e.target.value })}
            >
              <option value="">All Providers</option>
              {PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select
              className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              value={filters.status}
              onChange={e => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Status</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
            </select>
          </div>
        </div>

        {/* Signal Cards */}
        {loading ? (
          <div className="text-center py-10 text-gray-400">Loading signals...</div>
        ) : signals.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-10 text-center text-gray-400">
            No signals found. Scout is hunting — check back soon!
          </div>
        ) : (
          <div className="space-y-4">
            {signals.map(signal => (
              <div key={signal.id} className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-2xl">{getSignalIcon(signal.signal_type)}</span>
                      <span className="font-semibold text-lg">{signal.company_name}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${getStatusBadge(signal.status)}`}>
                        {signal.status || 'new'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-400 flex-wrap">
                      <span className="text-blue-400">🎯 {signal.current_provider}</span>
                      <span>{signal.provider_type}</span>
                      <span>• {signal.confidence} confidence</span>
                      <span>• via {signal.source}</span>
                    </div>
                    {signal.evidence && (
                      <div className="mt-3 bg-gray-900 rounded p-3 text-sm italic text-gray-300">
                        "{signal.evidence.slice(0, 200)}{signal.evidence.length > 200 ? '...' : ''}"
                      </div>
                    )}
                    {signal.website && (
                      <a href={signal.website} target="_blank" className="text-blue-400 text-sm mt-2 inline-block hover:underline">
                        {signal.website}
                      </a>
                    )}
                  </div>
                  <div className="flex flex-row md:flex-col gap-2">
                    <button
                      onClick={() => updateStatus(signal.id, 'contacted')}
                      className="px-3 py-1 bg-yellow-600 hover:bg-yellow-500 rounded text-sm"
                    >
                      Mark Contacted
                    </button>
                    <button
                      onClick={() => updateStatus(signal.id, 'qualified')}
                      className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded text-sm"
                    >
                      Qualify
                    </button>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-3">
                  {new Date(signal.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
