# Scope Expansion - Multi-Agent Mission Control

**From Dan (Feb 12, 2026 @ 7:27 PM)**

This isn't just Lex's dashboard — it's the **full Mission Control for ALL agents**.

---

## New Requirements

### 1. Multi-Agent Dashboard (`/agents`)
- Show ALL agents (main session, sub-agents, spawned sessions)
- For each agent display:
  - Name/label
  - Status (active/idle/complete)
  - Current task
  - Last activity timestamp
- Click into any agent to see details and history

### 2. Activity Logs / Full Audit Trail (`/logs`)
- Log EVERY action agents take:
  - Tool calls
  - Messages sent
  - Files read/written
  - Commands executed
- Store in Supabase with:
  - timestamp
  - agent_id
  - action_type
  - action_category
  - details (JSONB)
  - result
  - duration_ms
- Build searchable/filterable log viewer
- Filters: by agent, by action type, by date range
- Export capability (CSV or JSON)

### 3. Supabase Schema Additions

```sql
-- Agents table
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT,
  session_key TEXT UNIQUE,
  status TEXT DEFAULT 'idle', -- active, idle, complete
  current_task TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity logs table
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  action_type TEXT NOT NULL,
  action_category TEXT, -- tool_call, message, file_op, exec
  details JSONB,
  result TEXT,
  duration_ms INTEGER
);

CREATE INDEX idx_activity_logs_agent ON activity_logs(agent_id);
CREATE INDEX idx_activity_logs_timestamp ON activity_logs(timestamp DESC);
CREATE INDEX idx_activity_logs_action_type ON activity_logs(action_type);
```

---

## Priority
Build this AFTER the initial deploy is working. This is the next phase.
