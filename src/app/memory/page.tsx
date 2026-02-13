"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  person: "bg-blue-500/20 text-blue-400",
  business: "bg-purple-500/20 text-purple-400",
  personal: "bg-pink-500/20 text-pink-400",
  event: "bg-amber-500/20 text-amber-400",
};

export default function MemoryPage() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Memory</h1>
          <p className="text-zinc-400">What Lex knows and remembers</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input 
              placeholder="Search memories..." 
              className="pl-10 w-64 bg-zinc-800 border-zinc-700"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Brain className="w-8 h-8 text-amber-500" />
              <div>
                <p className="text-zinc-400 text-sm">Memory Files</p>
                <p className="text-2xl font-bold">15</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <User className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-zinc-400 text-sm">People</p>
                <p className="text-2xl font-bold">12</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Building className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-zinc-400 text-sm">Companies</p>
                <p className="text-2xl font-bold">8</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Zap className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-zinc-400 text-sm">Skills</p>
                <p className="text-2xl font-bold">12</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Memory List */}
      <div className="grid grid-cols-2 gap-6">
        {/* Recent Memories */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-500" />
              Recent Memories
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {memories.map((memory) => {
              const Icon = categoryIcons[memory.category];
              return (
                <div
                  key={memory.id}
                  className="p-4 bg-zinc-800 rounded-lg border border-zinc-700 hover:border-zinc-600 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${categoryColors[memory.category]}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium">{memory.title}</p>
                        <p className="text-xs text-zinc-500">{memory.date}</p>
                      </div>
                    </div>
                    <Badge className={categoryColors[memory.category]}>
                      {memory.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-zinc-400 line-clamp-2">{memory.content}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Memory Files */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              Memory Files
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { name: "MEMORY.md", size: "4.2 KB", updated: "Today" },
              { name: "memory/2026-02-12.md", size: "3.8 KB", updated: "Today" },
              { name: "memory/2026-02-11.md", size: "2.1 KB", updated: "Yesterday" },
              { name: "USER.md", size: "1.5 KB", updated: "Feb 10" },
              { name: "TOOLS.md", size: "2.8 KB", updated: "Today" },
              { name: "HEARTBEAT.md", size: "0.8 KB", updated: "Feb 10" },
            ].map((file) => (
              <div
                key={file.name}
                className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-zinc-400" />
                  <span className="font-mono text-sm">{file.name}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-zinc-500">
                  <span>{file.size}</span>
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
