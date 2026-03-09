"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Target,
  Lightbulb,
  BarChart3,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

interface SkillUsage {
  skill: string;
  count: number;
  success_rate: number;
  avg_time_saved_minutes: number;
  last_used: string;
}

interface LearningEvent {
  id: string;
  timestamp: string;
  event_type: "skill_used" | "feedback_positive" | "feedback_negative" | "correction" | "iteration";
  skill: string;
  context: string;
  outcome: "success" | "partial" | "redo" | null;
  notes: string;
}

interface ExperimentResult {
  id: string;
  experiment_name: string;
  metric: string;
  baseline_value: number;
  current_value: number;
  improvement_pct: number;
  status: "running" | "improved" | "no_change" | "regressed";
  last_updated: string;
}

// Mock data for now - will be replaced with Supabase
const mockSkillUsage: SkillUsage[] = [
  { skill: "research", count: 45, success_rate: 92, avg_time_saved_minutes: 25, last_used: "2 hours ago" },
  { skill: "meeting-prep", count: 28, success_rate: 89, avg_time_saved_minutes: 15, last_used: "1 day ago" },
  { skill: "email-draft", count: 67, success_rate: 95, avg_time_saved_minutes: 8, last_used: "3 hours ago" },
  { skill: "proposal-draft", count: 12, success_rate: 83, avg_time_saved_minutes: 45, last_used: "3 days ago" },
  { skill: "crm", count: 34, success_rate: 97, avg_time_saved_minutes: 5, last_used: "5 hours ago" },
  { skill: "prediction-trading", count: 8, success_rate: 0, avg_time_saved_minutes: 0, last_used: "Today" },
];

const mockLearningEvents: LearningEvent[] = [
  {
    id: "1",
    timestamp: "2026-03-08T21:30:00Z",
    event_type: "skill_used",
    skill: "research",
    context: "Karpathy autoresearch analysis",
    outcome: "success",
    notes: "Applied learnings to build trading framework",
  },
  {
    id: "2",
    timestamp: "2026-03-08T19:00:00Z",
    event_type: "iteration",
    skill: "meeting-prep",
    context: "Updated skill with Anthropic patterns",
    outcome: "success",
    notes: "Added iterative refinement loop",
  },
  {
    id: "3",
    timestamp: "2026-03-08T18:45:00Z",
    event_type: "skill_used",
    skill: "prediction-trading",
    context: "New skill created",
    outcome: null,
    notes: "Embedded trading lessons, deployed to VPS",
  },
];

const mockExperiments: ExperimentResult[] = [
  {
    id: "1",
    experiment_name: "Trading Strategy v1",
    metric: "Sharpe Ratio",
    baseline_value: 0,
    current_value: 0,
    improvement_pct: 0,
    status: "running",
    last_updated: "Just started",
  },
];

export default function LearningPage() {
  const [skillUsage, setSkillUsage] = useState<SkillUsage[]>(mockSkillUsage);
  const [learningEvents, setLearningEvents] = useState<LearningEvent[]>(mockLearningEvents);
  const [experiments, setExperiments] = useState<ExperimentResult[]>(mockExperiments);
  const [isLoading, setIsLoading] = useState(false);

  const totalSkillUses = skillUsage.reduce((sum, s) => sum + s.count, 0);
  const avgSuccessRate = skillUsage.reduce((sum, s) => sum + s.success_rate, 0) / skillUsage.length;
  const totalTimeSaved = skillUsage.reduce((sum, s) => sum + (s.count * s.avg_time_saved_minutes), 0);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Brain className="w-8 h-8 text-primary" />
              Lex Learning & Performance
            </h1>
            <p className="text-muted-foreground mt-1">
              Tracking what works, iterating on what doesn&apos;t
            </p>
          </div>
          <Button variant="outline" onClick={() => setIsLoading(true)}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Skill Uses</p>
                  <p className="text-3xl font-bold">{totalSkillUses}</p>
                </div>
                <Target className="w-10 h-10 text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Success Rate</p>
                  <p className="text-3xl font-bold">{avgSuccessRate.toFixed(0)}%</p>
                </div>
                <TrendingUp className="w-10 h-10 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Time Saved (est.)</p>
                  <p className="text-3xl font-bold">{Math.round(totalTimeSaved / 60)}h</p>
                </div>
                <Clock className="w-10 h-10 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Experiments</p>
                  <p className="text-3xl font-bold">{experiments.filter(e => e.status === "running").length}</p>
                </div>
                <Lightbulb className="w-10 h-10 text-yellow-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="skills" className="space-y-4">
          <TabsList>
            <TabsTrigger value="skills">Skill Performance</TabsTrigger>
            <TabsTrigger value="events">Learning Events</TabsTrigger>
            <TabsTrigger value="experiments">Experiments</TabsTrigger>
          </TabsList>

          {/* Skills Tab */}
          <TabsContent value="skills">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Skill Usage & Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {skillUsage.sort((a, b) => b.count - a.count).map((skill) => (
                    <div key={skill.skill} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-32 font-medium">{skill.skill}</div>
                        <Badge variant={skill.success_rate >= 90 ? "default" : skill.success_rate >= 70 ? "secondary" : "destructive"}>
                          {skill.success_rate}% success
                        </Badge>
                      </div>
                      <div className="flex items-center gap-8 text-sm text-muted-foreground">
                        <span>{skill.count} uses</span>
                        <span>~{skill.avg_time_saved_minutes}m saved/use</span>
                        <span>{skill.last_used}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Recent Learning Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {learningEvents.map((event) => (
                    <div key={event.id} className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                      <div className="mt-1">
                        {event.outcome === "success" ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : event.outcome === "redo" ? (
                          <XCircle className="w-5 h-5 text-red-500" />
                        ) : (
                          <Clock className="w-5 h-5 text-yellow-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{event.skill}</Badge>
                          <Badge variant="secondary">{event.event_type.replace("_", " ")}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(event.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="mt-1 text-sm">{event.context}</p>
                        {event.notes && (
                          <p className="mt-1 text-sm text-muted-foreground">{event.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Experiments Tab */}
          <TabsContent value="experiments">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  Autoresearch Experiments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {experiments.map((exp) => (
                    <div key={exp.id} className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{exp.experiment_name}</h3>
                          <p className="text-sm text-muted-foreground">Metric: {exp.metric}</p>
                        </div>
                        <Badge variant={
                          exp.status === "improved" ? "default" :
                          exp.status === "running" ? "secondary" :
                          exp.status === "regressed" ? "destructive" : "outline"
                        }>
                          {exp.status}
                        </Badge>
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Baseline</p>
                          <p className="font-mono">{exp.baseline_value}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Current</p>
                          <p className="font-mono">{exp.current_value}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Change</p>
                          <p className={`font-mono ${exp.improvement_pct > 0 ? "text-green-500" : exp.improvement_pct < 0 ? "text-red-500" : ""}`}>
                            {exp.improvement_pct > 0 ? "+" : ""}{exp.improvement_pct}%
                          </p>
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">Last updated: {exp.last_updated}</p>
                    </div>
                  ))}

                  {experiments.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No experiments running. Start one from the trading autoresearch framework!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Learning Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <h3 className="font-medium text-green-600 dark:text-green-400">What&apos;s Working</h3>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• Email drafts have highest success rate (95%)</li>
                  <li>• CRM queries are fast and reliable</li>
                  <li>• Research with iterative refinement delivers better quality</li>
                </ul>
              </div>
              <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                <h3 className="font-medium text-yellow-600 dark:text-yellow-400">Areas to Improve</h3>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• Proposal drafts need more context upfront</li>
                  <li>• Trading skill needs proven ROI before scaling</li>
                  <li>• Meeting prep could be more proactive</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
