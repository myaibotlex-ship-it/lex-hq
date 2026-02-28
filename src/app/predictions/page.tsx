"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getMarkets,
  getMarketsBySeries,
  getSeries,
  formatPrice,
  formatVolume,
  getMidPrice,
  KalshiMarket,
} from "@/lib/kalshi";
import {
  Flame,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  Search,
  Wallet,
  DollarSign,
  BarChart3,
  Clock,
} from "lucide-react";

type TabId = "hot" | "browse" | "portfolio";

const INTERESTING_SERIES = [
  { ticker: 'KXOAISOCIAL', name: 'OpenAI Social App' },
  { ticker: 'KXASL3', name: 'Anthropic ASL3' },
  { ticker: 'KXBUYBTC', name: 'US Buys Bitcoin' },
  { ticker: 'KXDOTPLOT', name: 'Fed Dot Plot' },
  { ticker: 'KXTRAVISKELCEWEDDING', name: 'Travis Kelce Wedding' },
];

export default function PredictionsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("hot");
  const [markets, setMarkets] = useState<KalshiMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [portfolioValue, setPortfolioValue] = useState<number | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    try {
      const res = await fetch('/api/kalshi/balance');
      const data = await res.json();
      if (data.balance !== undefined) {
        setBalance(data.balance / 100); // Convert cents to dollars
        setPortfolioValue(data.portfolio_value / 100);
      }
    } catch (err) {
      console.error("Failed to fetch balance:", err);
    }
  }, []);

  const fetchMarkets = useCallback(async () => {
    setLoading(true);
    try {
      let data: KalshiMarket[];
      if (selectedSeries) {
        data = await getMarketsBySeries(selectedSeries);
      } else {
        data = await getMarkets(50);
      }
      // Filter out multivariate combo markets and sort by volume
      const filtered = data
        .filter(m => !m.ticker.includes('KXMVE'))
        .sort((a, b) => (b.volume || 0) - (a.volume || 0));
      setMarkets(filtered);
      setLastUpdate(new Date());
    } catch (err) {
      console.error("Failed to fetch markets:", err);
    }
    setLoading(false);
  }, [selectedSeries]);

  useEffect(() => {
    fetchMarkets();
    fetchBalance();
    const interval = setInterval(() => {
      fetchMarkets();
      fetchBalance();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchMarkets, fetchBalance]);

  const filteredMarkets = searchQuery
    ? markets.filter((m) =>
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.ticker.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : markets;

  const tabs = [
    { id: "hot" as TabId, label: "Hot Markets", icon: Flame },
    { id: "browse" as TabId, label: "Browse", icon: Search },
    { id: "portfolio" as TabId, label: "Portfolio", icon: Wallet },
  ];

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1 flex items-center gap-2">
              🎰 Predictions
            </h1>
            <p className="text-muted-foreground text-sm">
              Kalshi prediction markets
            </p>
          </div>
          
          {/* Balance Card */}
          {balance !== null && (
            <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
              <CardContent className="p-4 flex items-center gap-4">
                <DollarSign className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Balance</p>
                  <p className="text-2xl font-bold text-green-500">${balance.toFixed(2)}</p>
                </div>
                {portfolioValue !== null && portfolioValue > 0 && (
                  <div className="border-l border-border pl-4">
                    <p className="text-xs text-muted-foreground">Portfolio</p>
                    <p className="text-lg font-semibold">${portfolioValue.toFixed(2)}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          <div className="flex items-center gap-2">
            {lastUpdate && (
              <span className="text-xs text-muted-foreground">
                Updated {lastUpdate.toLocaleTimeString()}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => { fetchMarkets(); fetchBalance(); }}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
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
            </Button>
          );
        })}
      </div>

      {/* Hot Markets Tab */}
      {activeTab === "hot" && (
        <div className="space-y-4">
          {/* Quick Series Filters */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedSeries === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedSeries(null)}
            >
              All Markets
            </Button>
            {INTERESTING_SERIES.map((s) => (
              <Button
                key={s.ticker}
                variant={selectedSeries === s.ticker ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSeries(s.ticker)}
              >
                {s.name}
              </Button>
            ))}
          </div>

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
          {loading && markets.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="animate-spin text-primary" size={32} />
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMarkets.slice(0, 30).map((market) => (
                <MarketCard key={market.ticker} market={market} />
              ))}
              {filteredMarkets.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No markets found
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Browse Tab */}
      {activeTab === "browse" && (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Browse markets by category coming soon...
          </p>
        </div>
      )}

      {/* Portfolio Tab */}
      {activeTab === "portfolio" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Your Portfolio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Cash Balance</p>
                  <p className="text-3xl font-bold text-green-500">
                    ${balance?.toFixed(2) || '0.00'}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Portfolio Value</p>
                  <p className="text-3xl font-bold">
                    ${portfolioValue?.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>
              
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No open positions</p>
                <p className="text-sm mt-2">Start trading to see your positions here</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function MarketCard({ market }: { market: KalshiMarket }) {
  const midPrice = getMidPrice(market);
  const spread = market.yes_ask && market.yes_bid ? market.yes_ask - market.yes_bid : 0;

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold mb-1 line-clamp-2">{market.title}</h3>
            <p className="text-xs text-muted-foreground mb-2">
              {market.ticker}
            </p>

            <div className="flex flex-wrap items-center gap-3 text-sm">
              {market.volume > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Vol:</span>
                  <span className="text-yellow-500 font-mono">
                    {formatVolume(market.volume)}
                  </span>
                </div>
              )}
              {spread > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Spread:</span>
                  <span className="font-mono">{spread}¢</span>
                </div>
              )}
              <Badge variant="outline" className="text-xs">
                {market.status}
              </Badge>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <div className="space-y-1">
              <div className="flex items-center justify-end gap-2">
                <span className="text-xs text-green-500">YES</span>
                <span className={`font-mono font-bold text-xl ${
                  midPrice > 50 ? "text-green-500" : "text-muted-foreground"
                }`}>
                  {midPrice}¢
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {market.yes_bid}-{market.yes_ask}¢
              </div>
            </div>
          </div>

          <a
            href={`https://kalshi.com/markets/${market.ticker}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary transition p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink size={16} />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
