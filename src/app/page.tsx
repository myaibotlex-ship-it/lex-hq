"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Phone,
  TrendingUp,
  Users,
  Zap,
  ArrowRight,
} from "lucide-react";

export default function MissionControl() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Good evening, Dan</h1>
        <p className="text-zinc-400">Here's what's happening today</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Tasks Due</p>
                <p className="text-2xl font-bold">3</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Meetings Today</p>
                <p className="text-2xl font-bold">2</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Calls Made</p>
                <p className="text-2xl font-bold">2</p>
              </div>
              <Phone className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Active Deals</p>
                <p className="text-2xl font-bold">5</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Today's Priorities */}
        <Card className="bg-zinc-900 border-zinc-800 col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Today's Priorities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span>Follow up with Sarah @ Acme Corp</span>
              </div>
              <Badge variant="outline" className="text-red-400 border-red-400/30">Urgent</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Finalize Q1 proposal for Beta Inc</span>
              </div>
              <Badge variant="outline" className="text-amber-400 border-amber-400/30">Today</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Review CLD quarterly numbers with Luke</span>
              </div>
              <Badge variant="outline" className="text-blue-400 border-blue-400/30">This Week</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start gap-2 bg-zinc-800 border-zinc-700 hover:bg-zinc-700">
              <Phone className="w-4 h-4" />
              Make a Call
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2 bg-zinc-800 border-zinc-700 hover:bg-zinc-700">
              <CheckCircle2 className="w-4 h-4" />
              Add Task
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2 bg-zinc-800 border-zinc-700 hover:bg-zinc-700">
              <Users className="w-4 h-4" />
              New Lead
            </Button>
          </CardContent>
        </Card>

        {/* Upcoming */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              Upcoming
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-zinc-800/50 rounded-lg">
              <div className="text-center">
                <p className="text-xs text-zinc-500">Tomorrow</p>
                <p className="text-lg font-bold">9:00</p>
              </div>
              <div>
                <p className="font-medium">Team Standup</p>
                <p className="text-sm text-zinc-400">Calibrate HCM</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-zinc-800/50 rounded-lg">
              <div className="text-center">
                <p className="text-xs text-zinc-500">Tomorrow</p>
                <p className="text-lg font-bold">2:00</p>
              </div>
              <div>
                <p className="font-medium">Call with John @ Beta</p>
                <p className="text-sm text-zinc-400">Proposal review</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-zinc-900 border-zinc-800 col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-4 text-sm">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <Phone className="w-4 h-4 text-green-500" />
              </div>
              <div className="flex-1">
                <p>Called David McClain</p>
                <p className="text-zinc-500">Roast call successful - 42 seconds</p>
              </div>
              <span className="text-zinc-500">2h ago</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Phone className="w-4 h-4 text-purple-500" />
              </div>
              <div className="flex-1">
                <p>Called Brynn</p>
                <p className="text-zinc-500">Art project chat - 10 minutes</p>
              </div>
              <span className="text-zinc-500">2h ago</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex-1">
                <p>11 skills created</p>
                <p className="text-zinc-500">Phone, email, research, and more</p>
              </div>
              <span className="text-zinc-500">1h ago</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
