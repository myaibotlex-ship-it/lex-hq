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
