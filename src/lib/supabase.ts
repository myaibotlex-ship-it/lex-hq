import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions
export interface Task {
  id: string;
  title: string;
  description: string | null;
  category: string;
  column_id: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  subtasks: { text: string; completed: boolean }[];
  labels: string[];
  notes: string | null;
  assignees: string[];
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  progress_percent: number;
  created_at: string;
  updated_at: string;
}

export interface Call {
  id: string;
  elevenlabs_call_id: string | null;
  to_number: string | null;
  to_name: string | null;
  purpose: string | null;
  status: string;
  duration_seconds: number | null;
  started_at: string | null;
  ended_at: string | null;
  notes: string | null;
  created_at: string;
}

// Legacy Agent interface (old table)
export interface Agent {
  id: string;
  label: string;
  session_key: string | null;
  status: 'active' | 'idle' | 'complete' | 'error';
  current_task: string | null;
  model: string | null;
  channel: string | null;
  parent_agent_id: string | null;
  created_at: string;
  last_active_at: string;
}

// MC Agent interface (current table - mc_agents)
export interface MCAgent {
  id: string;
  name: string;
  display_name: string;
  type: string;
  status: 'active' | 'idle' | 'offline';
  avatar_emoji: string | null;
  color: string | null;
  description: string | null;
  last_seen_at: string | null;
  config: Record<string, unknown> | null;
  created_at: string;
}

export type ActionCategory = 'tool' | 'message' | 'file' | 'exec' | 'browser' | 'api' | 'system';
export type ActivityType = 'tool_call' | 'tool_result' | 'message_received' | 'task' | 'health_check' | 'error' | 'research' | 'file_edit' | 'message' | 'cron';

// Legacy ActivityLog interface (old table)
export interface ActivityLog {
  id: string;
  agent_id: string | null;
  timestamp: string;
  action_type: string;
  action_category: ActionCategory;
  details: Record<string, unknown>;
  result: string | null;
  success: boolean;
  duration_ms: number | null;
  created_at: string;
  // Joined field
  agent?: Agent;
}

// MC Activity interface (current table - mc_activities)
export interface MCActivity {
  id: string;
  timestamp: string;
  type: ActivityType | string;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'error';
  metadata: Record<string, unknown> | null;
  source: string | null;
  agent_id: string | null;
  // Joined field
  agent?: MCAgent;
}

export type SourceType = 'tweet' | 'article' | 'blog' | 'video';

export interface ResearchSource {
  id: string;
  source_type: SourceType;
  source_url: string | null;
  author: string | null;
  title: string | null;
  summary: string | null;
  discovered_at: string;
  tags: string[];
}

export type UpgradeStatus = 'planned' | 'in_progress' | 'deployed' | 'rejected';

export interface WatchlistItem {
  id: string;
  symbol: string;
  asset_type: 'metal' | 'crypto' | 'stock';
  display_name: string;
  sort_order: number;
  created_at: string;
}

export interface Position {
  id: string;
  symbol: string;
  asset_type: 'metal' | 'crypto' | 'stock';
  display_name: string;
  quantity: number;
  unit: string;
  cost_basis: number;
  purchase_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectFile {
  id: string;
  project_id: string;
  name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_by: string | null;
  description: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Upgrade {
  id: string;
  title: string;
  description: string | null;
  source_id: string | null;
  status: UpgradeStatus;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  deployed_at: string | null;
  notes: string | null;
  // Joined field
  source?: ResearchSource;
}
