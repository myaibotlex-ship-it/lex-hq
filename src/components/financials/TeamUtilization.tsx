"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Users, Clock, DollarSign, AlertTriangle } from "lucide-react";

// Real data from 2025 Consultant Billing
const consultantHours = [
  { name: "Ben Anthony", hours: 1764, paid: 147000, rate: 77, risk: "high" },
  { name: "Cierra Calloway", hours: 1203, paid: 93000, rate: 70, risk: "medium" },
  { name: "Marley Kill", hours: 1134, paid: 59000, rate: 50, risk: "low" },
  { name: "Lauren Lyles", hours: 1000, paid: 52000, rate: 70, risk: "low" },
  { name: "Annie Dennis", hours: 814, paid: 67000, rate: 70, risk: "low" },
  { name: "Morgan Harris", hours: 771, paid: 64000, rate: 75, risk: "low" },
  { name: "Jeff Townes", hours: 650, paid: 45500, rate: 70, risk: "low" },
  { name: "Kris Kobernus", hours: 520, paid: 49400, rate: 95, risk: "low" },
];

const teamStructure = [
  { category: "W-2 Employees", count: 18, cost: 1710000 },
  { category: "Tech Consultants", count: 9, cost: 820000 },
  { category: "HR Consultants", count: 3, cost: 204000 },
  { category: "Gmind Offshore", count: 5, cost: 210000 },
];

const utilizationMetrics = {
  totalHours2025: 14479,
  billableTarget: 18000, // 9 consultants × 2000 hrs
  utilization: 80.4,
  unknownHours: 2272,
};

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  return `$${(value / 1000).toFixed(0)}K`;
}

function getBarColor(risk: string): string {
  switch (risk) {
    case "high": return "#ef4444";
    case "medium": return "#f59e0b";
    default: return "#22c55e";
  }
}

export function ConsultantHoursChart() {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          2025 Billable Hours by Consultant
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={consultantHours}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis type="number" stroke="#888" fontSize={11} />
            <YAxis type="category" dataKey="name" stroke="#888" fontSize={11} width={75} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }}
              formatter={(value, name) => {
                const v = value as number;
                if (name === "hours") return [`${v.toLocaleString()} hrs`, "Hours"];
                return [v, name];
              }}
            />
            <Bar dataKey="hours" radius={[0, 4, 4, 0]}>
              {consultantHours.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.risk)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="text-red-400 font-medium">Concentration Risk: Ben Anthony</p>
            <p className="text-muted-foreground">12.2% of all hours — need to cross-train clients</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TeamStructureChart() {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          Team Structure & Costs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {teamStructure.map((team) => (
            <div key={team.category} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{team.category}</span>
                <span className="font-medium">{team.count} people • {formatCurrency(team.cost)}</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${(team.cost / 1710000) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Labor Cost (2025):</span>
            <span className="font-bold text-lg">$2.94M</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function UtilizationMetrics() {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-primary" />
          Utilization Metrics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-secondary/60 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-primary">14,479</p>
            <p className="text-xs text-muted-foreground">Total Billable Hours</p>
          </div>
          <div className="bg-secondary/60 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-green-400">80.4%</p>
            <p className="text-xs text-muted-foreground">Utilization Rate</p>
          </div>
          <div className="bg-secondary/60 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-blue-400">$195</p>
            <p className="text-xs text-muted-foreground">Revenue per Hour</p>
          </div>
          <div className="bg-secondary/60 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-amber-400">2,272</p>
            <p className="text-xs text-muted-foreground">Unknown Hours ⚠️</p>
          </div>
        </div>
        <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <p className="text-sm text-amber-400">
            ⚠️ 2,272 hours (~$160K) have unknown consultant assignments in Airtable
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function ContractorRateCard() {
  const rates = [
    { tier: "Senior Tech", consultant: "Kris Kobernus", rate: 95, entity: "Principal Group LLC" },
    { tier: "Tech Lead", consultant: "Ben Anthony", rate: 77, entity: "—" },
    { tier: "Tech Senior", consultant: "Morgan Harris", rate: 75, entity: "—" },
    { tier: "Tech Standard", consultant: "Cierra, Annie, Jeff, Lauren", rate: 70, entity: "Various" },
    { tier: "HR Senior", consultant: "Aimee Sample", rate: 60, entity: "Shades of Grey HR" },
    { tier: "HR Standard", consultant: "Marley Kill, Christie McGuire", rate: 50, entity: "—" },
    { tier: "Offshore Dev", consultant: "Gmind Team (5)", rate: 45, entity: "Gmind LLC" },
    { tier: "Admin", consultant: "Shannon O'Connor", rate: 25, entity: "—" },
  ];

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-primary" />
          Consultant Rate Card
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-muted-foreground font-medium">Tier</th>
                <th className="text-left py-2 text-muted-foreground font-medium">Consultant(s)</th>
                <th className="text-right py-2 text-muted-foreground font-medium">Rate</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((r) => (
                <tr key={r.tier} className="border-b border-border/50">
                  <td className="py-2 font-medium">{r.tier}</td>
                  <td className="py-2 text-muted-foreground">{r.consultant}</td>
                  <td className="py-2 text-right font-mono">${r.rate}/hr</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
