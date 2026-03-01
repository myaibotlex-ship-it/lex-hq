"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Zap,
  Target,
  BarChart3,
  ArrowLeft,
} from "lucide-react";

interface KalshiMarket {
  strike: number;
  mid_prob: number;
  yes_bid: number;
  yes_ask: number;
  volume: number;
  subtitle: string;
}

interface GapHistory {
  timestamp: string;
  binance_price: number;
  kalshi_implied: number;
  gap_usd: number;
  direction: string;
}

interface ArbitrageData {
  binance: {
    price: number;
    timestamp: string;
  };
  kalshi: {
    implied_price: number | null;
    event: string | null;
    markets: KalshiMarket[];
  };
  gap: {
    current_usd: number | null;
    direction: string | null;
    is_opportunity: boolean;
  };
  history: {
    gaps_24h: GapHistory[];
    total_predictions: number;
    resolved_predictions: number;
    brier_score: number | null;
  };
}

export default function ArbitragePage() {
  const [data, setData] = useState<ArbitrageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/arbitrage");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
      setLastUpdate(new Date());
      setError(null);
    } catch (e) {
      setError("Failed to fetch data");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [fetchData, autoRefresh]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(price);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getBrierBadge = (score: number | null) => {
    if (score === null) return <Badge variant="secondary">No data</Badge>;
    if (score < 0.1) return <Badge className="bg-green-500">Excellent ({score.toFixed(3)})</Badge>;
    if (score < 0.2) return <Badge className="bg-blue-500">Good ({score.toFixed(3)})</Badge>;
    if (score < 0.25) return <Badge className="bg-yellow-500">Fair ({score.toFixed(3)})</Badge>;
    return <Badge variant="destructive">Poor ({score.toFixed(3)})</Badge>;
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-400 hover:text-white">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Zap className="w-8 h-8 text-yellow-500" />
                Latency Arbitrage
              </h1>
              <p className="text-gray-400 mt-1">
                Real-time Binance vs Kalshi price comparison
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant={autoRefresh ? "default" : "outline"}
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="gap-2"
            >
              {autoRefresh ? (
                <>
                  <Activity className="w-4 h-4" />
                  Live
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4" />
                  Paused
                </>
              )}
            </Button>
            <Button variant="outline" onClick={fetchData} className="gap-2">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Main Price Display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Binance Price */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-gray-400">
                <img src="https://cryptologos.cc/logos/binance-coin-bnb-logo.png" alt="Binance" className="w-5 h-5" />
                Binance BTC
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-white">
                {data?.binance.price ? formatPrice(data.binance.price) : "—"}
              </div>
              <div className="text-sm text-gray-500 mt-2">
                Real-time price
              </div>
            </CardContent>
          </Card>

          {/* Gap Indicator */}
          <Card className={`border-2 ${
            data?.gap.is_opportunity 
              ? "bg-yellow-500/20 border-yellow-500" 
              : "bg-gray-900 border-gray-800"
          }`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-gray-400">
                <Target className="w-5 h-5" />
                Current Gap
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-4xl font-bold flex items-center gap-2 ${
                data?.gap.is_opportunity ? "text-yellow-500" : "text-white"
              }`}>
                {data?.gap?.current_usd !== null && data?.gap?.current_usd !== undefined ? (
                  <>
                    ${data.gap.current_usd.toFixed(0)}
                    {data.gap.direction === "UP" ? (
                      <TrendingUp className="w-8 h-8 text-green-500" />
                    ) : (
                      <TrendingDown className="w-8 h-8 text-red-500" />
                    )}
                  </>
                ) : (
                  "—"
                )}
              </div>
              <div className="text-sm mt-2">
                {data?.gap.is_opportunity ? (
                  <Badge className="bg-yellow-500 text-black">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    OPPORTUNITY DETECTED
                  </Badge>
                ) : (
                  <span className="text-gray-500">Within normal range</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Kalshi Implied */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-gray-400">
                <BarChart3 className="w-5 h-5" />
                Kalshi Implied
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-white">
                {data?.kalshi.implied_price ? formatPrice(data.kalshi.implied_price) : "—"}
              </div>
              <div className="text-sm text-gray-500 mt-2">
                {data?.kalshi.event || "Loading..."}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{data?.history.gaps_24h.length || 0}</div>
              <div className="text-sm text-gray-400">Gaps Detected (24h)</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{data?.history.total_predictions || 0}</div>
              <div className="text-sm text-gray-400">Total Predictions</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{data?.history.resolved_predictions || 0}</div>
              <div className="text-sm text-gray-400">Resolved</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                {getBrierBadge(data?.history.brier_score ?? null)}
              </div>
              <div className="text-sm text-gray-400 mt-1">Brier Score</div>
            </CardContent>
          </Card>
        </div>

        {/* Kalshi Markets Table */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Kalshi BTC Markets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-800">
                    <th className="pb-3">Strike</th>
                    <th className="pb-3">Bid</th>
                    <th className="pb-3">Ask</th>
                    <th className="pb-3">Mid</th>
                    <th className="pb-3">Volume</th>
                    <th className="pb-3">vs Binance</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.kalshi.markets.map((market, i) => {
                    const diff = data.binance.price - market.strike;
                    return (
                      <tr key={i} className="border-b border-gray-800/50">
                        <td className="py-3 font-mono">{formatPrice(market.strike)}</td>
                        <td className="py-3">{market.yes_bid}¢</td>
                        <td className="py-3">{market.yes_ask}¢</td>
                        <td className="py-3 font-bold">{market.mid_prob.toFixed(0)}%</td>
                        <td className="py-3 text-gray-400">${market.volume.toFixed(0)}</td>
                        <td className={`py-3 ${diff > 0 ? "text-green-400" : "text-red-400"}`}>
                          {diff > 0 ? "+" : ""}{formatPrice(diff)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Gaps */}
        {data?.history.gaps_24h && data.history.gaps_24h.length > 0 && (
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                Recent Gap Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.history.gaps_24h.slice(-10).reverse().map((gap, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      {gap.direction === "UP" ? (
                        <TrendingUp className="w-5 h-5 text-green-500" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-500" />
                      )}
                      <div>
                        <div className="font-bold">${gap.gap_usd.toFixed(0)} gap</div>
                        <div className="text-sm text-gray-400">
                          Binance: {formatPrice(gap.binance_price)} → Kalshi: {formatPrice(gap.kalshi_implied)}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(gap.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          Last updated: {lastUpdate ? formatTime(lastUpdate) : "—"} • 
          Auto-refresh: {autoRefresh ? "ON (5s)" : "OFF"}
        </div>
      </div>
    </div>
  );
}
