# Changelog

All notable changes to The Bridge are documented here.

## [1.2.0] - 2026-02-13

### Added - Agent Upgrades System

#### `/upgrades` Page
Track self-improvement based on research and learnings.

**Research Feed**
- Log sources you learn from (tweets, articles, blogs, videos)
- Author, title, summary, and tags
- Link to original source
- Quick "Upgrade" button to create improvement from source

**Upgrade Pipeline**
- Kanban-style workflow: Planned → In Progress → Deployed
- Each upgrade linked to research source
- Priority badges (low/medium/high)
- Status progression with action buttons
- Expandable cards with notes and details

**Database Tables**
- `research_sources`: source_type, source_url, author, title, summary, tags
- `upgrades`: title, description, source_id, status, priority, deployed_at, notes

**Example Data Seeded**
- Alex Finn tweet about self-improving AI agents
- Simon Willison article on prompt engineering
- Lilian Weng blog on LLM agents
- 4 sample upgrades in various states

---

## [1.1.0] - 2026-02-13

### Added - Major Feature Update

#### Quick Actions That Work
- **New Task Modal** - Press `n` or click "New Task" to create tasks directly in Supabase
  - Title, description, priority, and category fields
  - Instantly reflects on the tasks page
- **Start Call Modal** - Trigger ElevenLabs outbound calls from the dashboard
  - Phone number formatting with real-time validation
  - Contact name and call purpose fields
  - Calls logged to Supabase for history tracking
  - Integrated with Lex voice agent

#### Real-time Agent Monitoring
- Agents now auto-refresh every **10 seconds**
- "Last seen" times update in real-time
- Visual pulse indicator for actively working agents
- Badge showing auto-refresh status

#### Activity Feed Improvements  
- Now shows **last 20 activities** on dashboard
- **Category filter tabs** - filter by exec, file, message, browser, etc.
- Click to expand log entries and see full details
- Sample activity logs pre-populated in Supabase

#### Stats That Update
- Real counts pulled from Supabase (tasks, projects, calls)
- **Today's activity count** prominently displayed
- **Task completion rate** percentage shown
- Calls today vs. total calls

#### System Status Bar
- Connection indicator (online/offline detection)
- System health check against `/api/health` endpoint
- "All Systems Operational" or degraded status
- Last sync timestamp

#### Keyboard Shortcuts
- `n` - Open new task modal
- `g a` - Go to agents page
- `g l` - Go to logs page
- `g t` - Go to tasks page
- `g p` - Go to projects page
- `g c` - Go to calls page
- `g h` - Go to home
- `g s` - Go to settings
- `/` or `⌘K` - Focus search (placeholder)

#### Settings Page
- `/settings` route with full settings UI
- **Password change** form (validates against current password)
- **Theme toggle** - dark mode active, light mode coming soon
- **Keyboard shortcuts reference** card
- **About section** with version info

### API Routes Added
- `POST /api/tasks` - Create new task
- `GET /api/tasks` - List all tasks
- `POST /api/calls` - Initiate ElevenLabs outbound call
- `GET /api/calls` - List recent calls
- `GET /api/health` - System health check
- `POST /api/settings/password` - Change password

### Technical
- Added ElevenLabs environment variables to Vercel
- New hooks: `useKeyboardShortcuts`
- New components: `NewTaskModal`, `StartCallModal`, `SystemStatus`
- CSS animations: `animate-scale-in` for modals
- Sample activity logs seeded to Supabase

---

## [1.0.0] - 2026-02-12

### Initial Release
- Mission Control dashboard
- Agents monitoring page
- Activity Logs page with filtering
- Tasks kanban board (Supabase-backed)
- Projects page with progress tracking
- Calls log page
- Memory page (placeholder)
- Chat page (placeholder)
- Mobile responsive sidebar
- Dark theme
- Password-protected access
