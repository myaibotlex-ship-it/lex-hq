"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Loader2,
  Calendar,
  DollarSign,
  BarChart3,
  Activity,
  Coins,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

interface AssetDetailModalProps {
  open: boolean;
  onClose: () => void;
  symbol: string;
  displayName: string;
  assetType: "metal" | "crypto" | "stock";
  currentPrice?: number;
  change?: number;
  changePercent?: number;
}

interface HistoryPoint {
  timestamp: number;
  price: number;
  date: string;
}

interface AssetDetails {
  marketCap?: number;
  volume24h?: number;
  high24h?: number;
  low24h?: number;
  ath?: number;
  athDate?: string;
  athChangePercent?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  peRatio?: number;
  eps?: number;
  dividendYield?: number;
  circulatingSupply?: number;
  totalSupply?: number;
  previousClose?: number;
}

const timeRanges = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
  { label: "1Y", days: 365 },
];

const assetTypeConfig = {
  metal: { icon: Coins, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  crypto: { icon: DollarSign, color: "text-purple-500", bg: "bg-purple-500/10" },
  stock: { icon: BarChart3, color: "text-blue-500", bg: "bg-blue-500/10" },
};

function formatLargeNumber(num: number | undefined): string {
  if (!num) return "—";
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  return `$${num.toLocaleString()}`;
}

function formatPrice(price: number): string {
  if (price < 1) return `$${price.toFixed(4)}`;
  return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function AssetDetailModal({
  open,
  onClose,
  symbol,
  displayName,
  assetType,
  currentPrice,
  change,
  changePercent,
}: AssetDetailModalProps) {
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [details, setDetails] = useState<AssetDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState(7);

  const config = assetTypeConfig[assetType];
  const isPositive = (change ?? 0) >= 0;

  useEffect(() => {
    if (open && symbol) {
      fetchData();
    }
  }, [open, symbol, selectedRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/prices/history?symbol=${symbol}&type=${assetType}&days=${selectedRange}`
      );
      const data = await res.json();
      setHistory(data.history || []);
      setDetails(data.details || null);
    } catch (error) {
      console.error("Failed to fetch asset data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate chart min/max for better visualization
  const prices = history.map((h) => h.price);
  const minPrice = Math.min(...prices) * 0.995;
  const maxPrice = Math.max(...prices) * 1.005;
  const priceChange = prices.length > 1 ? prices[prices.length - 1] - prices[0] : 0;
  const chartColor = priceChange >= 0 ? "#22c55e" : "#ef4444";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${config.bg}`}>
              <config.icon className={`w-6 h-6 ${config.color}`} />
            </div>
            <div>
              <DialogTitle className="text-xl">{symbol}</DialogTitle>
              <p className="text-sm text-muted-foreground">{displayName}</p>
            </div>
          </div>
        </DialogHeader>

        {/* Current Price */}
        <div className="mt-4">
          <div className="text-3xl font-bold font-terminal">
            {currentPrice ? formatPrice(currentPrice) : "—"}
          </div>
          {change !== undefined && changePercent !== undefined && (
            <div className={`flex items-center gap-1 mt-1 ${isPositive ? "text-green-400" : "text-red-400"}`}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>
                {isPositive ? "+" : ""}
                {change.toFixed(2)} ({isPositive ? "+" : ""}
                {changePercent.toFixed(2)}%)
              </span>
              <span className="text-muted-foreground text-sm ml-2">Today</span>
            </div>
          )}
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2 mt-4">
          {timeRanges.map((range) => (
            <Button
              key={range.days}
              variant={selectedRange === range.days ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedRange(range.days)}
              className={
                selectedRange === range.days
                  ? "btn-primary-glow"
                  : "bg-secondary border-border"
              }
            >
              {range.label}
            </Button>
          ))}
        </div>

        {/* Chart */}
        <div className="mt-4 h-64 bg-secondary/40 rounded-lg p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : history.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#71717a", fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[minPrice, maxPrice]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#71717a", fontSize: 10 }}
                  tickFormatter={(v) => `$${v.toLocaleString()}`}
                  width={70}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #3f3f46",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#a1a1aa" }}
                  formatter={(value) => [formatPrice(value as number), "Price"]}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={chartColor}
                  strokeWidth={2}
                  fill="url(#colorPrice)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No chart data available
            </div>
          )}
        </div>

        {/* Stats Grid */}
        {details && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
            {details.marketCap && (
              <StatCard label="Market Cap" value={formatLargeNumber(details.marketCap)} />
            )}
            {details.volume24h && (
              <StatCard label="24h Volume" value={formatLargeNumber(details.volume24h)} />
            )}
            {details.high24h && (
              <StatCard label="24h High" value={formatPrice(details.high24h)} />
            )}
            {details.low24h && (
              <StatCard label="24h Low" value={formatPrice(details.low24h)} />
            )}
            {details.fiftyTwoWeekHigh && (
              <StatCard label="52W High" value={formatPrice(details.fiftyTwoWeekHigh)} />
            )}
            {details.fiftyTwoWeekLow && (
              <StatCard label="52W Low" value={formatPrice(details.fiftyTwoWeekLow)} />
            )}
            {details.ath && (
              <StatCard label="All-Time High" value={formatPrice(details.ath)} />
            )}
            {details.peRatio && (
              <StatCard label="P/E Ratio" value={details.peRatio.toFixed(2)} />
            )}
            {details.eps && (
              <StatCard label="EPS" value={`$${details.eps.toFixed(2)}`} />
            )}
            {details.dividendYield && (
              <StatCard label="Dividend Yield" value={`${(details.dividendYield * 100).toFixed(2)}%`} />
            )}
            {details.circulatingSupply && (
              <StatCard
                label="Circulating Supply"
                value={details.circulatingSupply.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-secondary rounded-lg p-3 border border-border/50">
      <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="text-sm font-medium mt-1">{value}</div>
    </div>
  );
}
