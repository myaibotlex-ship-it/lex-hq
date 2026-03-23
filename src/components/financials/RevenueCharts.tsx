"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { TrendingUp, PieChart as PieChartIcon, DollarSign, Activity } from "lucide-react";

// Real data from Calibrate HCM
const revenueByQuarter = [
  { period: "Q1 2025", revenue: 680000, netIncome: 25000, margin: 43.2 },
  { period: "Q2 2025", revenue: 720000, netIncome: 30000, margin: 44.1 },
  { period: "Q3 2025", revenue: 710000, netIncome: 28000, margin: 42.8 },
  { period: "Q4 2025", revenue: 710000, netIncome: 36000, margin: 43.0 },
  { period: "Q1 2026", revenue: 946000, netIncome: 114000, margin: 70.6 },
];

const revenueByService = [
  { name: "Data Services", value: 1220000, percentage: 43 },
  { name: "Calibrate Impact", value: 772000, percentage: 27 },
  { name: "Tech Services", value: 739000, percentage: 26 },
  { name: "HR Services", value: 97000, percentage: 4 },
];

const marginTrend = [
  { month: "Jul 25", margin: 41.2 },
  { month: "Aug 25", margin: 42.8 },
  { month: "Sep 25", margin: 43.1 },
  { month: "Oct 25", margin: 44.2 },
  { month: "Nov 25", margin: 45.8 },
  { month: "Dec 25", margin: 48.2 },
  { month: "Jan 26", margin: 65.4 },
  { month: "Feb 26", margin: 68.9 },
  { month: "Mar 26", margin: 70.6 },
];

const cashFlow = [
  { month: "Oct 25", cash: 98000 },
  { month: "Nov 25", cash: 105000 },
  { month: "Dec 25", cash: 118000 },
  { month: "Jan 26", cash: 132000 },
  { month: "Feb 26", cash: 148000 },
  { month: "Mar 26", cash: 165000 },
];

const COLORS = ["#22c55e", "#3b82f6", "#8b5cf6", "#f59e0b"];

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  return `$${(value / 1000).toFixed(0)}K`;
}

export function RevenueQuarterlyChart() {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Revenue & Net Income by Quarter
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={revenueByQuarter} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="period" stroke="#888" fontSize={12} />
            <YAxis stroke="#888" fontSize={12} tickFormatter={formatCurrency} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }}
              formatter={(value) => formatCurrency(value as number)}
            />
            <Legend />
            <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="netIncome" name="Net Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <p className="text-sm text-green-400 font-medium">
            🚀 Q1 2026: $946K revenue (+39% QoQ), $114K net income (96% of FY25 total!)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function RevenueByServiceChart() {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <PieChartIcon className="w-4 h-4 text-primary" />
          2025 Revenue by Service Line
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={revenueByService}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              label={({ name, payload }) => `${name}: ${(payload as { percentage: number }).percentage}%`}
              labelLine={{ stroke: "#666" }}
            >
              {revenueByService.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }}
              formatter={(value) => formatCurrency(value as number)}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-2 gap-2 mt-4">
          {revenueByService.map((service, i) => (
            <div key={service.name} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORS[i] }}
              />
              <span className="text-muted-foreground">{service.name}:</span>
              <span className="font-medium">{formatCurrency(service.value)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function MarginTrendChart() {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Gross Margin Trend
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={marginTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="month" stroke="#888" fontSize={11} />
            <YAxis stroke="#888" fontSize={11} domain={[35, 75]} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }}
              formatter={(value) => `${(value as number).toFixed(1)}%`}
            />
            <Area
              type="monotone"
              dataKey="margin"
              stroke="#22c55e"
              fill="#22c55e"
              fillOpacity={0.2}
            />
          </AreaChart>
        </ResponsiveContainer>
        <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
          <p className="text-sm text-emerald-400 font-medium">
            📈 Margin improved from 43% → 71% (+28 points) in 6 months
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function CashFlowChart() {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-primary" />
          Cash Position
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={cashFlow} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="month" stroke="#888" fontSize={11} />
            <YAxis stroke="#888" fontSize={11} tickFormatter={formatCurrency} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }}
              formatter={(value) => formatCurrency(value as number)}
            />
            <Line
              type="monotone"
              dataKey="cash"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: "#3b82f6", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 flex justify-between text-sm">
          <span className="text-muted-foreground">Oct 2025: $98K</span>
          <span className="text-blue-400 font-medium">Mar 2026: $165K (+68%)</span>
        </div>
      </CardContent>
    </Card>
  );
}
