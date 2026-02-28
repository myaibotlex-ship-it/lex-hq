"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  ExternalLink,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock,
  BarChart3,
  Target,
  Eye,
  EyeOff,
  DollarSign,
  Activity,
  AlertTriangle,
  BookOpen,
  Info,
  Loader2,
} from "lucide-react";

interface Market {
  ticker: string;
  title: string;
  subtitle?: string;
  status: string;
  yes_bid: number;
  yes_ask: number;
  no_bid: number;
  no_ask: number;
  volume: number;
  volume_24h: number;
  open_interest: number;
  last_price: number;
  previous_yes_bid?: number;
  previous_yes_ask?: number;
  expiration_time: string;
  close_time: string;
  event_ticker: string;
  category?: string;
  result?: string;
  rules_primary?: string;
  yes_sub_title?: string;
  no_sub_title?: string;
}

interface OrderbookLevel {
  price: number;
  count: number;
}

interface Orderbook {
  yes: OrderbookLevel[];
  no: OrderbookLevel[];
}

interface Event {
  event_ticker: string;
  title: string;
  sub_title?: string;
  category: string;
  series_ticker: string;
  mutually_exclusive: boolean;
}

interface Candlestick {
  start_ts: number;
  end_ts: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export default function MarketDetailPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = use(params);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [market, setMarket] = useState<Market | null>(null);
  const [orderbook, setOrderbook] = useState<Orderbook>({ yes: [], no: [] });
  const [event, setEvent] = useState<Event | null>(null);
  const [candlesticks, setCandlesticks] = useState<Candlestick[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isWatching, setIsWatching] = useState(false);
  const [showRules, setShowRules] = useState(false);

  // Trade form state
  const [tradeAmount, setTradeAmount] = useState<string>("10");
  const [tradeSide, setTradeSide] = useState<"yes" | "no">("yes");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/kalshi/market/${ticker}`);
      if (!res.ok) {
        throw new Error("Failed to fetch market data");
      }
      const data = await res.json();
      setMarket(data.market);
      setOrderbook(data.orderbook);
      setEvent(data.event);
      setCandlesticks(data.candlesticks || []);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
    setLoading(false);
  }, [ticker]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Check watchlist
  useEffect(() => {
    const watchlist = JSON.parse(localStorage.getItem("kalshi_watchlist") || "[]");
    setIsWatching(watchlist.includes(ticker));
  }, [ticker]);

  const toggleWatchlist = () => {
    const watchlist = JSON.parse(localStorage.getItem("kalshi_watchlist") || "[]");
    if (isWatching) {
      const updated = watchlist.filter((t: string) => t !== ticker);
      localStorage.setItem("kalshi_watchlist", JSON.stringify(updated));
    } else {
      watchlist.push(ticker);
      localStorage.setItem("kalshi_watchlist", JSON.stringify(watchlist));
    }
    setIsWatching(!isWatching);
  };

  const formatPrice = (cents: number) => `${cents}¢`;
  const formatVolume = (vol: number) => {
    if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `$${(vol / 1000).toFixed(1)}K`;
    return `$${vol}`;
  };

  const spread = market ? market.yes_ask - market.yes_bid : 0;
  const midPrice = market ? Math.round((market.yes_bid + market.yes_ask) / 2) : 0;

  // Calculate price change from candlesticks
  const priceChange = candlesticks.length >= 2
    ? candlesticks[candlesticks.length - 1].close - candlesticks[0].open
    : 0;

  // Get orderbook depth
  const yesBidDepth = orderbook.yes.reduce((sum, level) => sum + level.count, 0);
  const noAskDepth = orderbook.no.reduce((sum, level) => sum + level.count, 0);

  if (loading && !market) {
    return (
      <div className="p-6 max-w-5xl mx-auto flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <Link href="/predictions" className="inline-flex items-center gap-2 text-muted-foreground hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Predictions
        </Link>
        <Card className="border-red-500/50">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-bold mb-2">Error Loading Market</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchData}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!market) return null;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/predictions" className="inline-flex items-center gap-2 text-muted-foreground hover:text-white mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Predictions
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-sm text-muted-foreground">{market.ticker}</span>
              <Badge variant={market.status === "open" ? "default" : "secondary"}>
                {market.status}
              </Badge>
              {event?.category && (
                <Badge variant="outline">{event.category}</Badge>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">{market.title}</h1>
            {market.subtitle && (
              <p className="text-muted-foreground mt-1">{market.subtitle}</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={toggleWatchlist}>
              {isWatching ? (
                <><EyeOff className="w-4 h-4 mr-2" />Watching</>
              ) : (
                <><Eye className="w-4 h-4 mr-2" />Watch</>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <a
              href={`https://kalshi.com/markets/${market.ticker}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4 mr-2" />
                Kalshi
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* Price Card */}
      <Card className="mb-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">YES Price</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono">{formatPrice(market.yes_bid)}</span>
                <span className="text-muted-foreground">-</span>
                <span className="text-3xl font-bold font-mono">{formatPrice(market.yes_ask)}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                {priceChange !== 0 && (
                  <span className={`text-sm flex items-center ${priceChange > 0 ? "text-green-500" : "text-red-500"}`}>
                    {priceChange > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                    {priceChange > 0 ? "+" : ""}{priceChange}¢ (30d)
                  </span>
                )}
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Spread</p>
              <span className={`text-2xl font-bold font-mono ${spread >= 10 ? "text-yellow-500" : "text-green-500"}`}>
                {spread}¢
              </span>
              <p className="text-xs text-muted-foreground mt-1">
                {spread >= 10 ? "Wide spread" : "Tight spread"}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Volume (24h)</p>
              <span className="text-2xl font-bold font-mono">{formatVolume(market.volume_24h)}</span>
              <p className="text-xs text-muted-foreground mt-1">
                Total: {formatVolume(market.volume)}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Open Interest</p>
              <span className="text-2xl font-bold font-mono">{market.open_interest.toLocaleString()}</span>
              <p className="text-xs text-muted-foreground mt-1">contracts</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Book */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Order Book
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {/* YES Side */}
                <div>
                  <div className="flex justify-between text-sm text-muted-foreground mb-2 px-2">
                    <span>Price</span>
                    <span>Contracts</span>
                  </div>
                  <div className="space-y-1">
                    {orderbook.yes.slice(0, 8).map((level, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center px-2 py-1 rounded text-sm relative overflow-hidden"
                      >
                        <div
                          className="absolute inset-0 bg-green-500/10"
                          style={{ width: `${Math.min(100, (level.count / Math.max(...orderbook.yes.map(l => l.count))) * 100)}%` }}
                        />
                        <span className="relative font-mono text-green-500">{level.price}¢</span>
                        <span className="relative font-mono">{level.count}</span>
                      </div>
                    ))}
                    {orderbook.yes.length === 0 && (
                      <p className="text-muted-foreground text-sm text-center py-4">No bids</p>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2 text-center">
                    Total Depth: {yesBidDepth} contracts
                  </div>
                </div>

                {/* NO Side */}
                <div>
                  <div className="flex justify-between text-sm text-muted-foreground mb-2 px-2">
                    <span>Price</span>
                    <span>Contracts</span>
                  </div>
                  <div className="space-y-1">
                    {orderbook.no.slice(0, 8).map((level, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center px-2 py-1 rounded text-sm relative overflow-hidden"
                      >
                        <div
                          className="absolute inset-0 bg-red-500/10"
                          style={{ width: `${Math.min(100, (level.count / Math.max(...orderbook.no.map(l => l.count))) * 100)}%` }}
                        />
                        <span className="relative font-mono text-red-500">{level.price}¢</span>
                        <span className="relative font-mono">{level.count}</span>
                      </div>
                    ))}
                    {orderbook.no.length === 0 && (
                      <p className="text-muted-foreground text-sm text-center py-4">No asks</p>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2 text-center">
                    Total Depth: {noAskDepth} contracts
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Price History */}
          {candlesticks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Price History (30 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-32 flex items-end gap-1">
                  {candlesticks.map((candle, i) => {
                    const maxPrice = Math.max(...candlesticks.map(c => c.high));
                    const minPrice = Math.min(...candlesticks.map(c => c.low));
                    const range = maxPrice - minPrice || 1;
                    const height = ((candle.close - minPrice) / range) * 100;
                    const isUp = candle.close >= candle.open;
                    
                    return (
                      <div
                        key={i}
                        className="flex-1 min-w-[4px] rounded-t transition-all hover:opacity-75"
                        style={{
                          height: `${Math.max(4, height)}%`,
                          backgroundColor: isUp ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)",
                        }}
                        title={`${new Date(candle.start_ts * 1000).toLocaleDateString()}: ${candle.close}¢`}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>{new Date(candlesticks[0]?.start_ts * 1000).toLocaleDateString()}</span>
                  <span>{new Date(candlesticks[candlesticks.length - 1]?.end_ts * 1000).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rules */}
          {market.rules_primary && (
            <Card>
              <CardHeader className="cursor-pointer" onClick={() => setShowRules(!showRules)}>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Market Rules
                  </span>
                  <span className="text-muted-foreground text-sm">
                    {showRules ? "Hide" : "Show"}
                  </span>
                </CardTitle>
              </CardHeader>
              {showRules && (
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{market.rules_primary}</p>
                </CardContent>
              )}
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Trade */}
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5" />
                Quick Trade
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={tradeSide === "yes" ? "default" : "outline"}
                  className={tradeSide === "yes" ? "bg-green-600 hover:bg-green-700" : ""}
                  onClick={() => setTradeSide("yes")}
                >
                  YES @ {market.yes_ask}¢
                </Button>
                <Button
                  variant={tradeSide === "no" ? "default" : "outline"}
                  className={tradeSide === "no" ? "bg-red-600 hover:bg-red-700" : ""}
                  onClick={() => setTradeSide("no")}
                >
                  NO @ {market.no_ask}¢
                </Button>
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Contracts</label>
                <Input
                  type="number"
                  value={tradeAmount}
                  onChange={(e) => setTradeAmount(e.target.value)}
                  min="1"
                  className="mt-1"
                />
              </div>

              <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cost</span>
                  <span className="font-mono">
                    ${((parseInt(tradeAmount) || 0) * (tradeSide === "yes" ? market.yes_ask : market.no_ask) / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Potential Payout</span>
                  <span className="font-mono text-green-500">
                    ${(parseInt(tradeAmount) || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Potential Profit</span>
                  <span className="font-mono text-green-500">
                    +${(((parseInt(tradeAmount) || 0) * (100 - (tradeSide === "yes" ? market.yes_ask : market.no_ask))) / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              <Button className="w-full" disabled>
                <DollarSign className="w-4 h-4 mr-2" />
                Place Order (Coming Soon)
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Trading through dashboard coming soon
              </p>
            </CardContent>
          </Card>

          {/* Market Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="w-5 h-5" />
                Market Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {event && (
                <div>
                  <span className="text-muted-foreground">Event</span>
                  <p className="font-medium">{event.title}</p>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Trade</span>
                <span className="font-mono">{market.last_price}¢</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Expiration</span>
                <span>{new Date(market.expiration_time).toLocaleDateString()}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Close Time</span>
                <span>{new Date(market.close_time).toLocaleString()}</span>
              </div>

              {market.yes_sub_title && (
                <div>
                  <span className="text-muted-foreground">YES means</span>
                  <p className="text-green-500">{market.yes_sub_title}</p>
                </div>
              )}

              {market.no_sub_title && (
                <div>
                  <span className="text-muted-foreground">NO means</span>
                  <p className="text-red-500">{market.no_sub_title}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Last Update */}
          {lastUpdate && (
            <p className="text-xs text-muted-foreground text-center">
              <Clock className="w-3 h-3 inline mr-1" />
              Last updated {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
