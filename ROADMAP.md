# Lex HQ Roadmap

Your personal command center is live! Here's what could make it even more powerful.

## 🎯 Current Features
- ✅ Dashboard with quick stats
- ✅ Tasks (Kanban board, Supabase-backed)
- ✅ Projects (Progress tracking, Supabase-backed)
- ✅ Calls (Log of Lex phone calls, Supabase-backed)
- ✅ Memory page (placeholder)
- ✅ Chat page (placeholder)
- ✅ Mobile responsive design
- ✅ **NEW** Quick Actions (New Task, Start Call) - fully functional
- ✅ **NEW** Real-time agent refresh (10 second intervals)
- ✅ **NEW** Activity feed with category filters
- ✅ **NEW** System status bar (connection, health, sync)
- ✅ **NEW** Keyboard shortcuts (n, g+a/l/t/p/c/h/s)
- ✅ **NEW** Settings page (password, theme, shortcuts)

## 🚀 High Priority - Next Up

### 1. Real-time Chat with Clawdbot Gateway
**Why:** Talk to Lex directly from the web instead of just Telegram
- WebSocket connection to Clawdbot gateway
- Message history stored in Supabase
- Support for voice messages (record & transcribe)
- Inline command execution results

### 2. Calendar Integration
**Why:** Lex should know your schedule
- Google Calendar OAuth integration
- Show upcoming events on dashboard
- "What's my day look like?" query
- Auto-suggest best times for calls/meetings

### ~~3. Quick Actions That Actually Work~~ ✅ DONE
**Status:** Shipped in v1.1.0
- ✅ "Make a Call" → Modal triggers ElevenLabs outbound call
- ✅ "Add Task" → Quick task creation modal
- "New Lead" → Lead capture form (future)

## 📈 Medium Priority - Power Features

### 4. Analytics Dashboard
**Why:** See patterns in your productivity
- Task completion trends
- Call volume over time
- Project velocity
- Time tracking integration

### 5. Email Integration
**Why:** Lex reads your email, might as well show summaries here
- Unread count on dashboard
- Important email highlights
- Quick reply from web UI
- Email-to-task conversion

### 6. Voice Commands
**Why:** Hands-free control
- "Hey Lex, add a task..."
- Browser speech recognition API
- Wake word detection (stretch goal)

### 7. Notifications Center
**Why:** Don't miss important stuff
- Browser push notifications
- In-app notification feed
- Configurable alert rules

## 🧪 Experimental / Fun Ideas

### 8. AI-Generated Daily Briefing
- Morning summary: "Here's what you should focus on today"
- Weather, calendar, top tasks, market sentiment
- TTS audio option for listening during commute

### 9. Deal Pipeline View
**Why:** CRM-lite for tracking sales/opportunities
- Drag-and-drop deal stages
- Integration with existing leads/deals tables
- Win/loss analytics

### 10. Personal Wiki / Notes
**Why:** Second brain functionality
- Markdown notes
- Full-text search
- Link to tasks/projects
- Memory integration (Lex's learnings)

### 11. Habit Tracker
**Why:** Gamify consistency
- Daily habits with streaks
- Integration with task system
- Weekly reports

### 12. Financial Dashboard
**Why:** Quick view of portfolio
- Unusual Whales integration for trades
- Account balances (Plaid integration)
- Spending categories

## 🔧 Technical Improvements

### Infrastructure
- [ ] Add authentication (Supabase Auth)
- [ ] Rate limiting on API calls
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring
- [ ] Database indexes for common queries

### UX Polish
- [x] Keyboard shortcuts (n, g+a/l/t/p/c/h/s) ✅
- [ ] Command palette (⌘K) - wired, needs implementation
- [x] Dark/light theme toggle (dark active, light wired) ✅
- [ ] Customizable dashboard layout
- [ ] Drag-and-drop everywhere

### Mobile App
- [ ] React Native or Expo version
- [ ] Push notifications
- [ ] Widget for iOS/Android home screen

---

## 💡 Contribution Ideas
If anyone else is working on this:
1. Keep the dark theme aesthetic
2. Use shadcn/ui components
3. Real-time updates via Supabase Realtime when possible
4. Mobile-first design

---

*Last updated: February 13, 2026*
