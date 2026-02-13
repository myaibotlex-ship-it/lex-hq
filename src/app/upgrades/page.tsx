"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase, ResearchSource, Upgrade, SourceType, UpgradeStatus } from "@/lib/supabase";
import {
  Rocket,
  BookOpen,
  Twitter,
  FileText,
  Video,
  Globe,
  Plus,
  X,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Lightbulb,
  Tag,
} from "lucide-react";

const sourceTypeIcons: Record<SourceType, React.ReactNode> = {
  tweet: <Twitter className="w-4 h-4 text-sky-400" />,
  article: <FileText className="w-4 h-4 text-emerald-400" />,
  blog: <Globe className="w-4 h-4 text-purple-400" />,
  video: <Video className="w-4 h-4 text-red-400" />,
};

const statusColors: Record<UpgradeStatus, string> = {
  planned: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  in_progress: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  deployed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  rejected: "bg-red-500/20 text-red-400 border-red-500/30",
};

const statusIcons: Record<UpgradeStatus, React.ReactNode> = {
  planned: <Lightbulb className="w-3.5 h-3.5" />,
  in_progress: <Clock className="w-3.5 h-3.5" />,
  deployed: <CheckCircle2 className="w-3.5 h-3.5" />,
  rejected: <XCircle className="w-3.5 h-3.5" />,
};

const priorityColors: Record<string, string> = {
  low: "bg-zinc-600/50 text-zinc-400",
  medium: "bg-blue-500/20 text-blue-400",
  high: "bg-red-500/20 text-red-400",
};

function useRelativeTime(date: string): string {
  const [, setTick] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);
  
  const now = new Date();
  const then = new Date(date);
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
  
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
}

function TimeAgo({ date }: { date: string }) {
  const relative = useRelativeTime(date);
  return <span>{relative}</span>;
}

function LoadingSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="mb-6">
        <div className="skeleton h-8 w-48 mb-2" />
        <div className="skeleton h-4 w-64" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="skeleton h-96 rounded-lg" />
        <div className="skeleton h-96 rounded-lg" />
      </div>
    </div>
  );
}

export default function UpgradesPage() {
  const [loading, setLoading] = useState(true);
  const [sources, setSources] = useState<ResearchSource[]>([]);
  const [upgrades, setUpgrades] = useState<(Upgrade & { source?: ResearchSource })[]>([]);
  const [showAddResearch, setShowAddResearch] = useState(false);
  const [showAddUpgrade, setShowAddUpgrade] = useState(false);
  const [expandedUpgrade, setExpandedUpgrade] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<ResearchSource | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [sourcesRes, upgradesRes] = await Promise.all([
        supabase.from("research_sources").select("*").order("discovered_at", { ascending: false }),
        supabase.from("upgrades").select("*, source:research_sources(*)").order("created_at", { ascending: false }),
      ]);

      setSources(sourcesRes.data || []);
      setUpgrades(upgradesRes.data || []);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const plannedUpgrades = upgrades.filter(u => u.status === "planned");
  const inProgressUpgrades = upgrades.filter(u => u.status === "in_progress");
  const deployedUpgrades = upgrades.filter(u => u.status === "deployed");

  async function updateUpgradeStatus(id: string, status: UpgradeStatus) {
    const updates: Partial<Upgrade> = { status };
    if (status === "deployed") {
      updates.deployed_at = new Date().toISOString();
    }
    
    await supabase.from("upgrades").update(updates).eq("id", id);
    fetchData();
  }

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl md:text-3xl font-bold mb-1 flex items-center gap-3">
          <Rocket className="w-7 h-7 text-amber-500" />
          Agent Upgrades
        </h1>
        <p className="text-zinc-500 text-sm">Track learnings and self-improvements</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="bg-zinc-900/80 border-zinc-800 animate-fade-in stagger-1 opacity-0">
          <CardContent className="p-3">
            <p className="text-zinc-600 text-xs uppercase tracking-wider">Research Sources</p>
            <p className="text-2xl font-bold mt-0.5">{sources.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/80 border-zinc-800 animate-fade-in stagger-2 opacity-0">
          <CardContent className="p-3">
            <p className="text-zinc-600 text-xs uppercase tracking-wider">Planned</p>
            <p className="text-2xl font-bold mt-0.5 text-zinc-400">{plannedUpgrades.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/80 border-zinc-800 animate-fade-in stagger-3 opacity-0">
          <CardContent className="p-3">
            <p className="text-zinc-600 text-xs uppercase tracking-wider">In Progress</p>
            <p className="text-2xl font-bold mt-0.5 text-amber-400">{inProgressUpgrades.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/80 border-zinc-800 animate-fade-in stagger-4 opacity-0">
          <CardContent className="p-3">
            <p className="text-zinc-600 text-xs uppercase tracking-wider">Deployed</p>
            <p className="text-2xl font-bold mt-0.5 text-emerald-400">{deployedUpgrades.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Research Feed */}
        <Card className="bg-zinc-900/80 border-zinc-800 card-glow animate-slide-up stagger-2 opacity-0">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 uppercase tracking-wider text-zinc-400">
                <BookOpen className="w-4 h-4 text-purple-500" />
                Research Feed
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddResearch(true)}
                className="bg-zinc-800/50 border-zinc-700 h-7 text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2 max-h-[500px] overflow-y-auto activity-stream">
            {sources.map((source) => (
              <div
                key={source.id}
                className="p-3 bg-zinc-800/40 rounded-lg border border-zinc-800/50 hover:border-zinc-700 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-zinc-800/80 flex-shrink-0">
                    {sourceTypeIcons[source.source_type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-zinc-500">{source.author}</span>
                      <span className="text-zinc-700">•</span>
                      <span className="text-xs text-zinc-600">
                        <TimeAgo date={source.discovered_at} />
                      </span>
                    </div>
                    <p className="text-sm font-medium mb-1">{source.title}</p>
                    <p className="text-xs text-zinc-500 line-clamp-2">{source.summary}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {source.tags?.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs bg-zinc-800/50 border-zinc-700">
                          <Tag className="w-2.5 h-2.5 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                      {source.source_url && (
                        <a
                          href={source.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-zinc-500 hover:text-white flex items-center gap-1 ml-auto"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View
                        </a>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedSource(source);
                      setShowAddUpgrade(true);
                    }}
                    className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    Upgrade
                  </Button>
                </div>
              </div>
            ))}
            {sources.length === 0 && (
              <div className="empty-state py-8">
                <BookOpen className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
                <p className="text-zinc-500 text-sm">No research yet</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddResearch(true)}
                  className="mt-3"
                >
                  Add your first source
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upgrade Pipeline */}
        <Card className="bg-zinc-900/80 border-zinc-800 card-glow animate-slide-up stagger-3 opacity-0">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 uppercase tracking-wider text-zinc-400">
                <Rocket className="w-4 h-4 text-amber-500" />
                Upgrade Pipeline
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddUpgrade(true)}
                className="bg-zinc-800/50 border-zinc-700 h-7 text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-4 max-h-[500px] overflow-y-auto activity-stream">
            {/* Planned Section */}
            {plannedUpgrades.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Lightbulb className="w-3.5 h-3.5" />
                  Planned ({plannedUpgrades.length})
                </h3>
                <div className="space-y-2">
                  {plannedUpgrades.map((upgrade) => (
                    <UpgradeCard
                      key={upgrade.id}
                      upgrade={upgrade}
                      expanded={expandedUpgrade === upgrade.id}
                      onToggle={() => setExpandedUpgrade(expandedUpgrade === upgrade.id ? null : upgrade.id)}
                      onStatusChange={updateUpgradeStatus}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* In Progress Section */}
            {inProgressUpgrades.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-amber-400/70 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  In Progress ({inProgressUpgrades.length})
                </h3>
                <div className="space-y-2">
                  {inProgressUpgrades.map((upgrade) => (
                    <UpgradeCard
                      key={upgrade.id}
                      upgrade={upgrade}
                      expanded={expandedUpgrade === upgrade.id}
                      onToggle={() => setExpandedUpgrade(expandedUpgrade === upgrade.id ? null : upgrade.id)}
                      onStatusChange={updateUpgradeStatus}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Deployed Section */}
            {deployedUpgrades.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-emerald-400/70 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Deployed ({deployedUpgrades.length})
                </h3>
                <div className="space-y-2">
                  {deployedUpgrades.map((upgrade) => (
                    <UpgradeCard
                      key={upgrade.id}
                      upgrade={upgrade}
                      expanded={expandedUpgrade === upgrade.id}
                      onToggle={() => setExpandedUpgrade(expandedUpgrade === upgrade.id ? null : upgrade.id)}
                      onStatusChange={updateUpgradeStatus}
                    />
                  ))}
                </div>
              </div>
            )}

            {upgrades.length === 0 && (
              <div className="empty-state py-8">
                <Rocket className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
                <p className="text-zinc-500 text-sm">No upgrades yet</p>
                <p className="text-zinc-600 text-xs mt-1">Add research and create upgrades</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Research Modal */}
      {showAddResearch && (
        <AddResearchModal
          onClose={() => setShowAddResearch(false)}
          onSuccess={() => {
            setShowAddResearch(false);
            fetchData();
          }}
        />
      )}

      {/* Add Upgrade Modal */}
      {showAddUpgrade && (
        <AddUpgradeModal
          sources={sources}
          preselectedSource={selectedSource}
          onClose={() => {
            setShowAddUpgrade(false);
            setSelectedSource(null);
          }}
          onSuccess={() => {
            setShowAddUpgrade(false);
            setSelectedSource(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
}

function UpgradeCard({
  upgrade,
  expanded,
  onToggle,
  onStatusChange,
}: {
  upgrade: Upgrade & { source?: ResearchSource };
  expanded: boolean;
  onToggle: () => void;
  onStatusChange: (id: string, status: UpgradeStatus) => void;
}) {
  return (
    <div
      className={`p-3 bg-zinc-800/40 rounded-lg border border-zinc-800/50 hover:border-zinc-700 transition-all cursor-pointer ${
        expanded ? "border-zinc-600" : ""
      }`}
      onClick={onToggle}
    >
      <div className="flex items-start gap-3">
        <div className={`p-1.5 rounded ${statusColors[upgrade.status]}`}>
          {statusIcons[upgrade.status]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium">{upgrade.title}</span>
            <Badge className={`text-xs ${priorityColors[upgrade.priority]}`}>
              {upgrade.priority}
            </Badge>
          </div>
          {upgrade.source && (
            <p className="text-xs text-zinc-600">
              From: {upgrade.source.author} - {upgrade.source.title}
            </p>
          )}
        </div>
        <ChevronRight className={`w-4 h-4 text-zinc-600 transition-transform ${expanded ? "rotate-90" : ""}`} />
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-zinc-800/50 animate-fade-in">
          {upgrade.description && (
            <p className="text-sm text-zinc-400 mb-3">{upgrade.description}</p>
          )}
          {upgrade.notes && (
            <div className="mb-3 p-2 bg-zinc-900/50 rounded text-xs text-zinc-500">
              <span className="text-zinc-600">Notes:</span> {upgrade.notes}
            </div>
          )}
          {upgrade.deployed_at && (
            <p className="text-xs text-zinc-600 mb-3">
              Deployed: {new Date(upgrade.deployed_at).toLocaleDateString()}
            </p>
          )}
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            {upgrade.status === "planned" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStatusChange(upgrade.id, "in_progress")}
                  className="h-7 text-xs bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                >
                  <ArrowRight className="w-3 h-3 mr-1" />
                  Start
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStatusChange(upgrade.id, "rejected")}
                  className="h-7 text-xs border-zinc-700"
                >
                  Reject
                </Button>
              </>
            )}
            {upgrade.status === "in_progress" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStatusChange(upgrade.id, "deployed")}
                  className="h-7 text-xs bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Deploy
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStatusChange(upgrade.id, "planned")}
                  className="h-7 text-xs border-zinc-700"
                >
                  Back to Planned
                </Button>
              </>
            )}
            {upgrade.status === "deployed" && (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Upgrade complete!
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AddResearchModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    source_type: "article" as SourceType,
    source_url: "",
    author: "",
    title: "",
    summary: "",
    tags: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("research_sources").insert({
        source_type: formData.source_type,
        source_url: formData.source_url || null,
        author: formData.author || null,
        title: formData.title || null,
        summary: formData.summary || null,
        tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
      });

      if (error) throw error;
      onSuccess();
    } catch (err) {
      console.error("Failed to add research:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md mx-4 p-6 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-500" />
            Add Research
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded-lg">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-zinc-400 mb-1.5">Type</label>
              <select
                value={formData.source_type}
                onChange={(e) => setFormData({ ...formData, source_type: e.target.value as SourceType })}
                className="w-full bg-zinc-800/50 border border-zinc-700 rounded-md px-3 py-2 text-sm"
              >
                <option value="article">Article</option>
                <option value="tweet">Tweet</option>
                <option value="blog">Blog</option>
                <option value="video">Video</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1.5">Author</label>
              <Input
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                placeholder="Who wrote it?"
                className="bg-zinc-800/50 border-zinc-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">Title</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="What's it called?"
              className="bg-zinc-800/50 border-zinc-700"
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">URL</label>
            <Input
              value={formData.source_url}
              onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
              placeholder="https://..."
              className="bg-zinc-800/50 border-zinc-700"
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">Key Takeaways</label>
            <Textarea
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              placeholder="What did you learn?"
              className="bg-zinc-800/50 border-zinc-700 min-h-[80px]"
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">Tags (comma-separated)</label>
            <Input
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="agents, prompting, tools"
              className="bg-zinc-800/50 border-zinc-700"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-zinc-700">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-purple-600 hover:bg-purple-500">
              {loading ? "Adding..." : "Add Research"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddUpgradeModal({
  sources,
  preselectedSource,
  onClose,
  onSuccess,
}: {
  sources: ResearchSource[];
  preselectedSource: ResearchSource | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    source_id: preselectedSource?.id || "",
    priority: "medium" as "low" | "medium" | "high",
    notes: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("upgrades").insert({
        title: formData.title,
        description: formData.description || null,
        source_id: formData.source_id || null,
        priority: formData.priority,
        notes: formData.notes || null,
        status: "planned",
      });

      if (error) throw error;
      onSuccess();
    } catch (err) {
      console.error("Failed to add upgrade:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md mx-4 p-6 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Rocket className="w-5 h-5 text-amber-500" />
            New Upgrade
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded-lg">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">Upgrade Title *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="What's the improvement?"
              className="bg-zinc-800/50 border-zinc-700"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Details about the upgrade..."
              className="bg-zinc-800/50 border-zinc-700 min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-zinc-400 mb-1.5">Source</label>
              <select
                value={formData.source_id}
                onChange={(e) => setFormData({ ...formData, source_id: e.target.value })}
                className="w-full bg-zinc-800/50 border border-zinc-700 rounded-md px-3 py-2 text-sm"
              >
                <option value="">No source</option>
                {sources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.author}: {s.title?.slice(0, 30)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1.5">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as "low" | "medium" | "high" })}
                className="w-full bg-zinc-800/50 border border-zinc-700 rounded-md px-3 py-2 text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">Notes</label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Implementation thoughts..."
              className="bg-zinc-800/50 border-zinc-700"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-zinc-700">
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.title} className="flex-1 bg-amber-600 hover:bg-amber-500">
              {loading ? "Creating..." : "Create Upgrade"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
