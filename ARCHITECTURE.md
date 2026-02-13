# The Bridge - Architecture

## Overview

The Bridge (lex-hq) is a Next.js dashboard that displays real-time data from Clawdbot agents, phone calls, and activities. Data flows from source systems through sync scripts into Supabase, then to the frontend.

```
┌─────────────────────────────────────────────────────────────────────┐
│                          DATA SOURCES                               │
├──────────────────────┬──────────────────────┬───────────────────────┤
│  Clawdbot Sessions   │   ElevenLabs API     │   Manual Input        │
│  ~/.clawdbot/agents/ │   Conversations API  │   The Bridge UI       │
│  *.jsonl files       │   Voice calls        │   Tasks, Projects     │
└──────────────────────┴──────────────────────┴───────────────────────┘
           │                      │                      │
           ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         SYNC SCRIPTS                                │
│  ~/clawd/scripts/                                                   │
├──────────────────────┬──────────────────────┬───────────────────────┤
│  sync-agents.js      │  sync-calls.js       │  activity-sync.js     │
│  Agent last_seen     │  Call history        │  Session activities   │
│  Session stats       │  Duration/status     │  Tool calls/results   │
└──────────────────────┴──────────────────────┴───────────────────────┘
           │                      │                      │
           ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         SUPABASE                                    │
│  https://kfyhljqanxunrnnvnftc.supabase.co                          │
├──────────────────────┬──────────────────────┬───────────────────────┤
│  mc_agents           │  calls               │  mc_activities        │
│  • id, name          │  • elevenlabs_call_id│  • agent_id, type     │
│  • last_seen_at      │  • status, duration  │  • title, status      │
│  • config (JSONB)    │  • started_at        │  • metadata           │
├──────────────────────┼──────────────────────┼───────────────────────┤
│  tasks               │  projects            │  agents (legacy)      │
│  • Kanban columns    │  • Progress tracking │  • Activity logs      │
│  • Subtasks, labels  │  • Status            │  • Session tracking   │
└──────────────────────┴──────────────────────┴───────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         THE BRIDGE                                  │
│  https://lex-hq.vercel.app                                         │
├─────────────────────────────────────────────────────────────────────┤
│  Next.js 16 + Turbopack                                            │
│  @supabase/supabase-js client                                      │
│  shadcn/ui components                                               │
│  Password: protected via middleware                                 │
└─────────────────────────────────────────────────────────────────────┘
```

## Sync Scripts

### sync-agents.js
**Location:** `~/clawd/scripts/sync-agents.js`
**Schedule:** Every 15 minutes via cron

Reads Clawdbot session files and updates **TWO tables**:

**1. mc_agents table** (team roster):
- `last_seen_at` - Timestamp of most recent activity
- `config.session_count` - Total sessions for this agent
- `config.sessions_today` - Sessions created today
- `config.current_task` - Most recent user message (task context)

**2. agents table** (dashboard display):
- `last_active_at` - Timestamp for dashboard
- `status` - 'active' if seen in last 15 min, else 'idle'
- `current_task` - Task context for display

**Agent Mapping:**
```
Clawdbot Name → mc_agents.name → agents.session_key
main          → lex            → agent:main:main
scout         → scout          → agent:scout:main
closer        → closer         → agent:closer:main
voice         → voice          → agent:voice:main
numbers       → numbers        → agent:numbers:main
```

### sync-calls.js
**Location:** `~/clawd/scripts/sync-calls.js`
**Schedule:** Every 15 minutes via cron

Fetches conversations from ElevenLabs API and upserts to `calls` table:
- `elevenlabs_call_id` - Unique conversation ID
- `to_name` - Call summary title from ElevenLabs
- `status` - completed/failed/in_progress
- `duration_seconds` - Call length
- `started_at` / `ended_at` - Timestamps

Preserves manually-entered `notes` and `purpose` fields.

### sync-bridge.sh
**Location:** `~/clawd/scripts/sync-bridge.sh`
**Schedule:** Every 15 minutes via `mission-control-sync` cron

Master script that runs all syncs in sequence:
1. `sync-agents.js` - Fast, reads file timestamps
2. `sync-calls.js` - Medium, ElevenLabs API call
3. `activity-sync.js` - Optional, can be slow

### activity-sync.js
**Location:** `~/clawd/scripts/activity-sync.js`
**Mode:** Real-time watcher or cron-triggered

Parses JSONL session files and logs to `mc_activities`:
- Tool calls (exec, read, write, browser, etc.)
- Tool results (success/failure)
- User messages (filtered heartbeats)

State tracked in `~/.clawdbot/activity-sync-state.json` to avoid duplicates.

## Cron Jobs

| Name | Schedule | Script | Purpose |
|------|----------|--------|---------|
| mission-control-sync | */15 * * * * | sync-bridge.sh | Main data sync |

## Database Tables

### mc_agents (Mission Control Agents)
Primary table for agent status display.

```sql
id           UUID PRIMARY KEY
name         TEXT UNIQUE (lex, scout, closer, voice, numbers)
display_name TEXT
type         TEXT (assistant, scout, sales, marketing, finance)
status       TEXT (active, idle, offline)
avatar_emoji TEXT
color        TEXT
description  TEXT
last_seen_at TIMESTAMPTZ
config       JSONB (session_count, sessions_today, current_task)
created_at   TIMESTAMPTZ
```

### calls (Phone Call History)
ElevenLabs voice call records.

```sql
id                 UUID PRIMARY KEY
elevenlabs_call_id TEXT
to_number          TEXT
to_name            TEXT
purpose            TEXT
status             TEXT (pending, in_progress, completed, failed)
duration_seconds   INTEGER
started_at         TIMESTAMPTZ
ended_at           TIMESTAMPTZ
notes              TEXT
created_at         TIMESTAMPTZ
```

### mc_activities (Agent Activity Log)
Detailed action history for all agents.

```sql
id          UUID PRIMARY KEY
timestamp   TIMESTAMPTZ
type        TEXT (tool_call, tool_result, message_received, task, etc.)
title       TEXT
description TEXT
status      TEXT (pending, in_progress, completed, failed, error)
metadata    JSONB
source      TEXT
agent_id    UUID REFERENCES mc_agents(id)
```

## API Endpoints

### The Bridge API Routes

| Endpoint | Method | Purpose |
|----------|--------|---------|
| /api/login | POST | Authenticate with password |
| /api/logout | POST | Clear auth cookie |
| /api/calls | GET | Fetch call history (future) |
| /api/tasks | GET/POST/PATCH | Task CRUD (future) |

### External APIs Used

| Service | Endpoint | Purpose |
|---------|----------|---------|
| ElevenLabs | /v1/convai/conversations | Fetch call history |
| Supabase | /rest/v1/* | Database operations |

## Environment Variables

### .env.supabase
```
SUPABASE_URL=https://kfyhljqanxunrnnvnftc.supabase.co
SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_KEY=<service key>
SUPABASE_DB_URL=<postgres connection string>
```

### .env.elevenlabs
```
ELEVENLABS_API_KEY=<api key>
ELEVENLABS_AGENT_ID=agent_2301kha5e7ynebds6g400a2e4zpf
```

### lex-hq/.env.local (Vercel)
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
BRIDGE_PASSWORD=...
```

## Security

- Password protection via middleware (cookie-based)
- Supabase service key used only in sync scripts (server-side)
- Anon key used in frontend (with RLS policies)
- Environment variables in Vercel (not in repo)

## Future Enhancements

1. **Real-time Supabase subscriptions** - Live updates without polling
2. **Webhook endpoint** - Receive activities from Clawdbot gateway directly
3. **Make a Call button** - Trigger ElevenLabs outbound calls
4. **Chat integration** - Talk to Lex through The Bridge
5. **Calendar sync** - Show upcoming events
6. **Email notifications** - Push important alerts
