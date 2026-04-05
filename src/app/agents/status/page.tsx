'use client';

import { useState, useEffect } from 'react';

interface Agent {
  id: string;
  name: string;
  emoji: string;
  model: string;
  status: 'online' | 'offline' | 'busy';
  lastRun?: string;
  lastDuration?: number;
  tasks: string[];
}

const AGENTS: Agent[] = [
  { id: 'scout', name: 'Scout', emoji: '🔍', model: 'ollama/qwen2.5:72b', status: 'online', tasks: ['Research', 'Intel gathering', 'Signal hunting'] },
  { id: 'closer', name: 'Closer', emoji: '🤝', model: 'ollama/qwen2.5:72b', status: 'online', tasks: ['Sales outreach', 'Follow-ups', 'Pipeline'] },
  { id: 'voice', name: 'Voice', emoji: '📢', model: 'ollama/qwen2.5:72b', status: 'online', tasks: ['Content writing', 'LinkedIn posts', 'Comms'] },
  { id: 'numbers', name: 'Numbers', emoji: '📊', model: 'kimi/kimi-k2.5', status: 'online', tasks: ['Financial analysis', 'Metrics', 'Reports'] },
  { id: 'shield', name: 'Shield', emoji: '🛡️', model: 'ollama/qwen2.5:72b', status: 'online', tasks: ['Compliance', 'Contracts', 'Legal'] },
  { id: 'runner', name: 'Runner', emoji: '⚙️', model: 'ollama/qwen2.5:72b', status: 'online', tasks: ['Automation', 'Scripts', 'Workflows'] },
  { id: 'coder', name: 'Coder', emoji: '💻', model: 'kimi/kimi-k2.5', status: 'online', tasks: ['Development', 'Debugging', 'Features'] },
  { id: 'chief', name: 'Chief', emoji: '⚡', model: 'kimi/kimi-k2.5', status: 'online', tasks: ['Strategy', 'Planning', 'Orchestration'] },
  { id: 'marketing', name: 'Marketing', emoji: '📣', model: 'ollama/qwen2.5:72b', status: 'online', tasks: ['Campaigns', 'Brand', 'Content'] },
];

export default function AgentStatusPage() {
  const [agents, setAgents] = useState(AGENTS);
  const [spawning, setSpawning] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500 animate-pulse';
      case 'offline': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getModelBadge = (model: string) => {
    if (model.includes('kimi')) return 'bg-purple-900 text-purple-300';
    if (model.includes('qwen')) return 'bg-blue-900 text-blue-300';
    return 'bg-gray-700 text-gray-300';
  };

  const spawnAgent = async (agentId: string) => {
    setSpawning(agentId);
    // In real implementation, this would call the gateway API
    setTimeout(() => setSpawning(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">🤖 Agent Status</h1>
            <p className="text-gray-400 text-sm">Your AI workforce on Mac Studio</p>
          </div>
          <div className="mt-2 md:mt-0 flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500"></span> Online
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-500"></span> Busy
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500"></span> Offline
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-400">{agents.filter(a => a.status === 'online').length}</div>
            <div className="text-sm text-gray-400">Online</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-400">{agents.filter(a => a.model.includes('kimi')).length}</div>
            <div className="text-sm text-gray-400">On Kimi K2.5</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-400">{agents.filter(a => a.model.includes('qwen')).length}</div>
            <div className="text-sm text-gray-400">On Qwen 72B</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-400">$0</div>
            <div className="text-sm text-gray-400">API Cost/Day</div>
          </div>
        </div>

        {/* Agent Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map(agent => (
            <div key={agent.id} className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{agent.emoji}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg">{agent.name}</span>
                      <span className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`}></span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${getModelBadge(agent.model)}`}>
                      {agent.model.split('/')[1] || agent.model}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mt-3 text-sm text-gray-400">
                {agent.tasks.map((task, i) => (
                  <span key={i}>
                    {task}{i < agent.tasks.length - 1 ? ' • ' : ''}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => spawnAgent(agent.id)}
                  disabled={spawning === agent.id}
                  className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 rounded text-sm transition-colors"
                >
                  {spawning === agent.id ? 'Spawning...' : '▶ Spawn Task'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Cost Comparison */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h3 className="font-semibold mb-4">💰 Cost Comparison</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="text-gray-400 text-sm mb-2">Before (Claude Opus for all)</div>
              <div className="text-2xl font-bold text-red-400">~$500-1000/mo</div>
              <div className="text-sm text-gray-500">9 agents × heavy usage</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-2">Now (Mac Studio local)</div>
              <div className="text-2xl font-bold text-green-400">~$0/mo*</div>
              <div className="text-sm text-gray-500">*electricity only (~$20)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
