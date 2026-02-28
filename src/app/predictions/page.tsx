"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getHotEvents,
  getRecentTrades,
  parseOutcomePrices,
  parseOutcomes,
  formatVolume,
  formatProb,
  PolymarketEvent,
  PolymarketTrade,
} from "@/lib/polymarket";
import {
  Flame,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ExternalLink,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type TabId = "hot" | "trades" | "portfolio";

export default function PredictionsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("hot");
  const [events, setEvents] = useState<PolymarketEvent[]>([]);
  const [trades, setTrades] = useState<PolymarketTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [walletAddress, setWalletAddress] = useState("");

  const fetchHotMarkets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getHotEvents(30);
      setEvents(data);
      setLastUpdate(new Date());
    } catch (err) {
      console.error("Failed to fetch events:", err);
    }
    setLoading(false);
  }, []);

  const fetchTrades = useCallback(async () => {
    try {
      const data = await getRecentTrades(100);
      setTrades(data);
    } catch (err) {
      console.error("Failed to fetch trades:", err);
    }
  }, []);

  useEffect(() => {
    fetchHotMarkets();
    fetchTrades();
    const interval = setInterval(() => {
      fetchHotMarkets();
      fetchTrades();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchHotMarkets, fetchTrades]);

  const filteredEvents = searchQuery
    ? events.filter((e) =>
        e.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : events;

  const whaleTrades = trades.filter((t) => t.size * t.price >= 1000);

  const tabs = [
    { id: "hot" as TabId, label: "Hot Markets", icon: Flame, count: events.length },
    { id: "trades" as TabId, label: "Live Trades", icon: TrendingUp, count: whaleTrades.length },
    { id: "portfolio" as TabId, label: "Portfolio", icon: Wallet },
  ];

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1 flex items-center gap-2">
              🎰 Predictions
            </h1>
            <p className="text-muted-foreground text-sm">
              Polymarket tracking & analysis
            </p>
          </div>
          <div className="flex items-center gap-2">
            {lastUpdate && (
              <span className="text-xs text-muted-foreground">
                Updated {lastUpdate.toLocaleTimeString()}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchHotMarkets();
                fetchTrades();
              }}
              disabled={loading}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border pb-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className="gap-2"
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && (
                <Badge variant="secondary" className="ml-1">
                  {tab.count}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>

      {/* Hot Markets Tab */}
      {activeTab === "hot" && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search markets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Markets List */}
          {loading && events.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="animate-spin text-primary" size={32} />
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Live Trades Tab */}
      {activeTab === "trades" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="outline" className="gap-1">
              <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
              🐋 Whale trades ($1K+)
            </Badge>
            <span className="text-xs text-muted-foreground">
              {whaleTrades.length} large trades
            </span>
          </div>

          <div className="space-y-2">
            {trades.slice(0, 50).map((trade, idx) => (
              <TradeCard key={`${trade.transactionHash}-${idx}`} trade={trade} />
            ))}
          </div>
        </div>
      )}

      {/* Portfolio Tab */}
      {activeTab === "portfolio" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Track Your Portfolio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter your Polymarket wallet address (0x...)"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                />
                <Button disabled={!walletAddress || walletAddress.length < 42}>
                  Track
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Enter your wallet address to see your positions and P&L
              </p>
            </CardContent>
          </Card>

          {!walletAddress && (
            <div className="text-center py-12">
              <Wallet className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground">
                Enter your wallet address above to track positions
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EventCard({ event }: { event: PolymarketEvent }) {
  const [expanded, setExpanded] = useState(false);
  const topMarket = event.markets?.[0];
  const prices = parseOutcomePrices(topMarket?.outcomePrices || null);
  const outcomes = parseOutcomes(topMarket?.outcomes || null);
  const yesPrice = prices[0];

  return (
    <Card
      className="cursor-pointer hover:border-primary/50 transition-colors"
      onClick={() => setExpanded(!expanded)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {event.icon && (
            <img
              src={event.icon}
              alt=""
              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
            />
          )}

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold mb-2 line-clamp-2">{event.title}</h3>

            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">24h:</span>
                <span className="text-yellow-500 font-mono font-medium">
                  {formatVolume(event.volume24hr)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-mono">{formatVolume(event.volume)}</span>
              </div>
              {event.markets && event.markets.length > 1 && (
                <Badge variant="outline">{event.markets.length} markets</Badge>
              )}
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            {topMarket && (
              <div className="space-y-1">
                <div className="flex items-center justify-end gap-2">
                  <span className="text-xs text-muted-foreground">
                    {outcomes[0]}
                  </span>
                  <span
                    className={`font-mono font-bold text-lg ${
                      yesPrice > 0.5 ? "text-green-500" : "text-muted-foreground"
                    }`}
                  >
                    {formatProb(yesPrice)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Expanded Markets */}
        {expanded && event.markets && event.markets.length > 1 && (
          <div className="mt-4 pt-4 border-t border-border space-y-2">
            {event.markets.slice(0, 10).map((market) => {
              const mPrices = parseOutcomePrices(market.outcomePrices);
              return (
                <div
                  key={market.id}
                  className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg"
                >
                  <span className="text-sm truncate flex-1 mr-4">
                    {market.question}
                  </span>
                  <span
                    className={`font-mono font-medium ${
                      mPrices[0] > 0.5 ? "text-green-500" : "text-muted-foreground"
                    }`}
                  >
                    {formatProb(mPrices[0])}
                  </span>
                </div>
              );
            })}
            <a
              href={`https://polymarket.com/event/${event.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 mt-2 py-2 text-primary hover:underline text-sm"
              onClick={(e) => e.stopPropagation()}
            >
              Open on Polymarket
              <ExternalLink size={14} />
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TradeCard({ trade }: { trade: PolymarketTrade }) {
  const isBuy = trade.side === "BUY";
  const value = trade.size * trade.price;
  const isWhale = value >= 1000;

  return (
    <Card className={isWhale ? "border-l-4 border-l-yellow-500" : ""}>
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-lg ${
              isBuy ? "bg-green-500/20" : "bg-red-500/20"
            }`}
          >
            {isBuy ? (
              <ArrowUpRight className="text-green-500" size={16} />
            ) : (
              <ArrowDownRight className="text-red-500" size={16} />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge
                variant="outline"
                className={
                  isBuy
                    ? "border-green-500/50 text-green-500"
                    : "border-red-500/50 text-red-500"
                }
              >
                {trade.side}
              </Badge>
              <span className="text-sm font-medium">{trade.outcome}</span>
              <span className="text-muted-foreground">@</span>
              <span className="text-sm font-mono text-primary">
                {(trade.price * 100).toFixed(1)}¢
              </span>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {trade.title}
            </p>
          </div>

          <div className="text-right flex-shrink-0">
            <div
              className={`font-mono font-bold ${
                isWhale ? "text-yellow-500" : ""
              }`}
            >
              ${value.toFixed(2)}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock size={10} />
              {formatDistanceToNow(trade.timestamp * 1000, { addSuffix: true })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
