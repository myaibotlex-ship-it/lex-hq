# Feature: Agent Upgrades Tab

**From Dan (Feb 12, 2026 @ 8:05 PM)**

Track self-improvement from research. When we read articles, tweets, or posts and learn something useful, log it. Then plan and deploy upgrades based on those learnings.

---

## Supabase Tables

```sql
-- Research sources (tweets, articles, posts we learned from)
CREATE TABLE research_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL, -- tweet, article, blog, video
  source_url TEXT,
  author TEXT,
  title TEXT,
  summary TEXT, -- Key takeaways
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  tags TEXT[] -- e.g., ['automation', 'prompting', 'tools']
);

-- Planned upgrades based on research
CREATE TABLE upgrades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  source_id UUID REFERENCES research_sources(id),
  status TEXT DEFAULT 'planned', -- planned, in_progress, deployed, rejected
  priority TEXT DEFAULT 'low', -- low, medium, high, critical
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deployed_at TIMESTAMPTZ,
  notes TEXT
);

-- Indexes
CREATE INDEX idx_upgrades_status ON upgrades(status);
CREATE INDEX idx_research_sources_type ON research_sources(source_type);
```

---

## Page: `/upgrades`

### Section 1: Research Feed
- Cards showing sources we've learned from
- Each card: author, title, summary, tags, source type icon
- Link to original source
- "Add Research" button → modal form

### Section 2: Upgrade Pipeline
Kanban-style or list view with columns:
- **Planned** — Ideas to implement
- **In Progress** — Currently being built
- **Deployed** — Live improvements
- **Rejected** — Decided against (for reference)

Each upgrade card shows:
- Title
- Linked source (if any)
- Priority badge (color coded)
- Created date
- Click to expand → full description + notes

---

## Sidebar
Add "Upgrades" to sidebar navigation with 🚀 or 🧠 icon.

---

## Seed Data

```sql
-- Example research source
INSERT INTO research_sources (source_type, source_url, author, title, summary, tags) VALUES
('tweet', 'https://x.com/alexfinn/status/...', 'Alex Finn', 'Feed AI articles to self-improve', 
 'Give the link of a blog post to your AI. Say "read this post then create a plan for improving our setup." Do this with EVERY article you see.',
 ARRAY['automation', 'self-improvement', 'prompting']);

-- Example upgrade
INSERT INTO upgrades (title, description, status, priority, notes) VALUES
('Article-based self-improvement', 'When Dan shares articles, read them and create improvement plans. Proactively apply learnings.', 
 'deployed', 'high', 'Already doing this - formalized the pattern.');
```

---

## Priority
Build after core features are stable. This is the "meta" layer for continuous improvement.
