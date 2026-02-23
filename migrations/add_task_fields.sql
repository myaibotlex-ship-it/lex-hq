-- Migration: Add notes and assignees columns to tasks table
-- Run this in Supabase SQL Editor

-- Add notes column for free-form updates/comments
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add assignees column as text array for tagging people
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignees TEXT[] DEFAULT '{}';

-- Optional: Add index on assignees for faster queries when filtering by assignee
CREATE INDEX IF NOT EXISTS idx_tasks_assignees ON tasks USING GIN (assignees);

-- Verify the changes
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'tasks' 
ORDER BY ordinal_position;
