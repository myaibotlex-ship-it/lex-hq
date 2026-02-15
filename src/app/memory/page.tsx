"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Brain,
  Search,
  Calendar,
  FileText,
  User,
  Building,
  Heart,
  Zap,
  Clock,
} from "lucide-react";

interface MemoryEntry {
  id: string;
  category: "person" | "business" | "personal" | "event";
  title: string;
  content: string;
  date: string;
}

const memories: MemoryEntry[] = [
  {
    id: "1",
    category: "person",
    title: "David McClain",
    content: "One of Dan's best friends. Phone: (303) 921-0911. Had lunch Feb 12. Made a comment questioning if Dan has 'real friends' — successful roast call!",
    date: "Feb 12, 2026",
  },
  {
    id: "2",
    category: "personal",
    title: "Brynn Rackley",
    content: "Dan's daughter, age 6. Loves Taylor Swift (favorite song: 'Opalite'). Had a 10-minute call about her art project, friends Casey & Karen (twins), and playing 'pandas' at recess.",
    date: "Feb 12, 2026",
  },
  {
    id: "3",
    category: "business",
    title: "ElevenLabs Phone Setup",
    content: "Phone system working! Agent ID: agent_2301kha5e7ynebds6g400a2e4zpf. Uses dynamic context injection. Noah from ElevenLabs gave us credits.",
    date: "Feb 12, 2026",
  },
  {
    id: "4",
    category: "event",
    title: "Skills Created",
    content: "Built 12 skills: phone-call, email-draft, linkedin-content, meeting-prep, proposal-draft, crm, competitor-intel, research, morning-brief, weekly-review, follow-up, personal-assistant.",
    date: "Feb 12, 2026",
  },
];

const categoryIcons = {
  person: User,
  business: Building,
  personal: Heart,
  event: Zap,
};

const categoryColors = {
  person: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  business: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  personal: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  event: "bg-primary/20 text-primary border-primary/30",
};

export default function MemoryPage() {
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">Memory</h1>
          <p className="text-muted-foreground text-sm">What Lex knows and remembers</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search memories..." 
            className="pl-9 w-full md:w-64 bg-secondary border-border h-9 text-sm"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="bg-card border-border hero-stat card-glow animate-fade-in stagger-1 opacity-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Brain className="w-8 h-8 text-primary/30" />
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider">Memory Files</p>
                <p className="text-2xl font-bold mt-0.5">15</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border hero-stat card-glow animate-fade-in stagger-2 opacity-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <User className="w-8 h-8 text-blue-500/30" />
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider">People</p>
                <p className="text-2xl font-bold mt-0.5">12</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border hero-stat card-glow animate-fade-in stagger-3 opacity-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Building className="w-8 h-8 text-purple-500/30" />
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider">Companies</p>
                <p className="text-2xl font-bold mt-0.5">8</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border hero-stat card-glow animate-fade-in stagger-4 opacity-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Zap className="w-8 h-8 text-accent/30" />
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider">Skills</p>
                <p className="text-2xl font-bold mt-0.5">12</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Memory List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Memories */}
        <Card className="bg-card border-border card-glow animate-slide-up stagger-2 opacity-0">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
              <Calendar className="w-4 h-4 text-primary" />
              Recent Memories
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            {memories.map((memory, index) => {
              const Icon = categoryIcons[memory.category];
              return (
                <div
                  key={memory.id}
                  className="p-3 bg-secondary/60 rounded-lg border border-border/50 hover:border-border transition-all cursor-pointer group animate-fade-in opacity-0"
                  style={{ animationDelay: `${0.2 + index * 0.05}s` }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-md flex items-center justify-center ${categoryColors[memory.category]}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{memory.title}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {memory.date}
                        </p>
                      </div>
                    </div>
                    <Badge className={`text-xs ${categoryColors[memory.category]}`} variant="outline">
                      {memory.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 font-terminal">{memory.content}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Memory Files */}
        <Card className="bg-card border-border card-glow animate-slide-in-right stagger-3 opacity-0">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
              <FileText className="w-4 h-4 text-blue-500" />
              Memory Files
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {[
              { name: "MEMORY.md", size: "4.2 KB", updated: "Today" },
              { name: "memory/2026-02-12.md", size: "3.8 KB", updated: "Today" },
              { name: "memory/2026-02-11.md", size: "2.1 KB", updated: "Yesterday" },
              { name: "USER.md", size: "1.5 KB", updated: "Feb 10" },
              { name: "TOOLS.md", size: "2.8 KB", updated: "Today" },
              { name: "HEARTBEAT.md", size: "0.8 KB", updated: "Feb 10" },
            ].map((file, index) => (
              <div
                key={file.name}
                className="flex items-center justify-between p-2.5 bg-secondary/60 rounded-lg border border-border/50 hover:border-border hover:bg-muted transition-all cursor-pointer animate-fade-in opacity-0"
                style={{ animationDelay: `${0.3 + index * 0.03}s` }}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="font-terminal text-sm text-zinc-300">{file.name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="font-terminal">{file.size}</span>
                  <span>{file.updated}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
