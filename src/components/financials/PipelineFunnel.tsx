"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";

// Real pipeline data from Airtable
const pipelineData = {
  historical: {
    closedWon: 41,
    closedLost: 50,
    winRate: 45,
  },
  active: [
    { name: "Front Range Holdings", stage: "Quoted", value: "TBD", type: "Data Services" },
    { name: "Refuel", stage: "Quoted", value: "TBD", type: "Tech Services" },
    { name: "Satanta District Hospital", stage: "Quoted", value: "TBD", type: "Data Services" },
    { name: "Grand Restaurants Group", stage: "Upsell", value: "TBD", type: "Impact" },
    { name: "BMI Caps", stage: "Upsell", value: "TBD", type: "Tech Services" },
    { name: "Viemed", stage: "Early", value: "TBD", type: "Data Services" },
    { name: "Fieldings Culinary", stage: "Early", value: "TBD", type: "Tech Services" },
    { name: "Frontline Service", stage: "Early", value: "TBD", type: "Data Services" },
  ],
  byServiceLine: {
    "Data Services": 37,
    "Impact": 12,
    "Tech Services": 12,
    "HR Services": 2,
  },
};

const stageColors: Record<string, string> = {
  Quoted: "bg-blue-500",
  Upsell: "bg-purple-500",
  Early: "bg-amber-500",
};

export function PipelineFunnel() {
  const stages = [
    { name: "Early Stage", count: 3, color: "bg-amber-500" },
    { name: "Quoted", count: 3, color: "bg-blue-500" },
    { name: "Upsell", count: 2, color: "bg-purple-500" },
  ];

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          Active Pipeline (8 Opportunities)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Visual Funnel */}
        <div className="space-y-2 mb-6">
          {stages.map((stage, i) => (
            <div key={stage.name} className="flex items-center gap-3">
              <div
                className={`${stage.color} h-10 rounded-lg flex items-center justify-center text-white font-medium text-sm`}
                style={{ width: `${100 - i * 15}%` }}
              >
                {stage.name}: {stage.count}
              </div>
            </div>
          ))}
        </div>

        {/* Active Opportunities */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Active Deals</h4>
          {pipelineData.active.map((deal) => (
            <div
              key={deal.name}
              className="flex items-center justify-between py-2 px-3 bg-secondary/60 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${stageColors[deal.stage]}`} />
                <span className="font-medium text-sm">{deal.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{deal.type}</span>
                <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded">
                  {deal.stage}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Warning */}
        <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="text-amber-400 font-medium">Pipeline Needs Attention</p>
            <p className="text-muted-foreground">Only 8 active opportunities — target 15+ for $4M revenue</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function WinRateAnalysis() {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Historical Win Rate
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-green-500/10 rounded-lg p-4 text-center border border-green-500/30">
            <p className="text-3xl font-bold text-green-400">{pipelineData.historical.closedWon}</p>
            <p className="text-xs text-muted-foreground">Won</p>
          </div>
          <div className="bg-red-500/10 rounded-lg p-4 text-center border border-red-500/30">
            <p className="text-3xl font-bold text-red-400">{pipelineData.historical.closedLost}</p>
            <p className="text-xs text-muted-foreground">Lost</p>
          </div>
          <div className="bg-blue-500/10 rounded-lg p-4 text-center border border-blue-500/30">
            <p className="text-3xl font-bold text-blue-400">{pipelineData.historical.winRate}%</p>
            <p className="text-xs text-muted-foreground">Win Rate</p>
          </div>
        </div>

        {/* By Service Line */}
        <h4 className="text-sm font-medium text-muted-foreground mb-3">Closed-Won by Service Line</h4>
        <div className="space-y-3">
          {Object.entries(pipelineData.byServiceLine).map(([service, count]) => (
            <div key={service} className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span>{service}</span>
                  <span className="font-medium">{count} deals</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${(count / 37) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ContractorSpendBreakdown() {
  const spendByYear = [
    { year: "2024", amount: 280000 },
    { year: "2025", amount: 1230000 },
    { year: "2026 YTD", amount: 281000 },
  ];

  const topContractors = [
    { name: "To The Top Consulting (Tony)", total: 239000 },
    { name: "Ben Anthony", total: 219000 },
    { name: "Cierra Calloway", total: 170000 },
    { name: "Sunday Silence LLC (Nick)", total: 121000 },
    { name: "Morgan Harris", total: 104000 },
  ];

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-primary" />
          1099 Contractor Spend (Bill.com)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* By Year */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {spendByYear.map((y) => (
            <div key={y.year} className="bg-secondary/60 rounded-lg p-3 text-center">
              <p className="text-xl font-bold">${(y.amount / 1000).toFixed(0)}K</p>
              <p className="text-xs text-muted-foreground">{y.year}</p>
            </div>
          ))}
        </div>

        {/* Top Contractors */}
        <h4 className="text-sm font-medium text-muted-foreground mb-3">Top 5 Contractors (All Time)</h4>
        <div className="space-y-2">
          {topContractors.map((c, i) => (
            <div key={c.name} className="flex items-center justify-between py-2 px-3 bg-secondary/40 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground w-5">{i + 1}.</span>
                <span className="text-sm font-medium">{c.name}</span>
              </div>
              <span className="text-sm font-mono">${(c.total / 1000).toFixed(0)}K</span>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-border flex justify-between">
          <span className="text-muted-foreground">Total All Time (47 vendors):</span>
          <span className="font-bold text-lg">$1.79M</span>
        </div>
      </CardContent>
    </Card>
  );
}
