"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Bot,
  Eye,
  Target,
  Activity,
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
} from "lucide-react";

type TabId = "dashboard" | "opportunities" | "trades" | "watchlist" | "agents";

interface Agent {
  name: string;
  status: "running" | "idle" | "error";
  lastRun: string;
  nextRun?: string;
  description: string;
}

interface Opportunity {
  ticker: string;
  title: string;
  type: string;
  spread: number;
  yesBid: number;
  yesAsk: number;
  volume: number;
  category: string;
}

interface Trade {
  id: string;
  ticker: string;
  side: "yes" | "no";
  contracts: number;
  price: number;
  status: string;
  timestamp: string;
  pnl?: number;
}

const AGENTS: Agent[] = [
  {
    name: "Scanner",
    status: "running",
    lastRun: "5 min ago",
    nextRun: "25 min",
    description: "Monitors all Kalshi markets for opportunities",
  },
  {
    name: "Analyst",
    status: "idle",
    lastRun: "On demand",
    description: "Deep research on specific market opportunities",
  },
  {
    name: "Trader",
    status: "idle",
    lastRun: "On demand",
    description: "Executes trades via Kalshi API",
  },
  {
    name: "Watchdog",
    status: "running",
    lastRun: "5 min ago",
    nextRun: "5 min",
    description: "Monitors positions, P&L, system health",
  },
];

export default function PredictionsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  // Account data
  const [balance, setBalance] = useState<number>(150);
  const [portfolioValue, setPortfolioValue] = useState<number>(0);
  const [todayPnL, setTodayPnL] = useState<number>(0);
  
  // Opportunities
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  
  // Trades
  const [trades, setTrades] = useState<Trade[]>([]);
  
  // Watchlist
  const [watchlist, setWatchlist] = useState<string[]>([
    "KXEARTHQUAKEJAPAN-30",
    "KXMUSKTRILLION-27",
    "KXOAIANTH-40-OAI",
  ]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch balance
      const balanceRes = await fetch('/api/kalshi?endpoint=balance');
      const balanceData = await balanceRes.json();
      if (balanceData.balance !== undefined) {
        setBalance(balanceData.balance / 100);
        setPortfolioValue(balanceData.portfolio_value / 100);
      }
      
      setLastUpdate(new Date());
    } catch (err) {
      console.error("Failed to fetch data:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Mock opportunities data (would come from scanner output)
  useEffect(() => {
    setOpportunities([
      {
        ticker: "KXEARTHQUAKEJAPAN-30",
        title: "Will there be an 8.0+ earthquake in Japan before 2030?",
        type: "SPREAD",
        spread: 11,
        yesBid: 45,
        yesAsk: 56,
        volume: 17435,
        category: "Climate and Weather",
      },
      {
        ticker: "KXGOVTCUTS-28-1000",
        title: "Will government spending decrease by 1000 before 2028?",
        type: "SPREAD",
        spread: 11,
        yesBid: 6,
        yesAsk: 17,
        volume: 13145,
        category: "Politics",
      },
      {
        ticker: "KXMUSKTRILLION-27",
        title: "Will Elon Musk be a trillionaire before 2027?",
        type: "LIQUID",
        spread: 3,
        yesBid: 66,
        yesAsk: 69,
        volume: 170857,
        category: "Financials",
      },
      {
        ticker: "KXOAIANTH-40-OAI",
        title: "Will OpenAI or Anthropic IPO first?",
        type: "LIQUID",
        spread: 3,
        yesBid: 50,
        yesAsk: 53,
        volume: 30845,
        category: "Financials",
      },
    ]);
  }, []);

  const tabs = [
    { id: "dashboard" as TabId, label: "Dashboard", icon: BarChart3 },
    { id: "opportunities" as TabId, label: "Opportunities", icon: Target },
    { id: "trades" as TabId, label: "Trades", icon: TrendingUp },
    { id: "watchlist" as TabId, label: "Watchlist", icon: Eye },
    { id: "agents" as TabId, label: "Agents", icon: Bot },
  ];

  const totalValue = balance + portfolioValue;
  const totalReturn = ((totalValue - 150) / 150) * 100;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1 flex items-center gap-2">
              🎰 Lex Trading System
            </h1>
            <p className="text-muted-foreground text-sm">
              Kalshi prediction markets • Multi-agent trading
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
              onClick={fetchData}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <DollarSign className="w-4 h-4" />
              Cash Balance
            </div>
            <p className="text-2xl font-bold text-green-500">${balance.toFixed(2)}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Wallet className="w-4 h-4" />
              Portfolio Value
            </div>
            <p className="text-2xl font-bold text-blue-500">${portfolioValue.toFixed(2)}</p>
          </CardContent>
        </Card>
        
        <Card className={`bg-gradient-to-br ${todayPnL >= 0 ? 'from-green-500/10 to-emerald-500/10 border-green-500/20' : 'from-red-500/10 to-rose-500/10 border-red-500/20'}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingUp className="w-4 h-4" />
              Today's P&L
            </div>
            <p className={`text-2xl font-bold ${todayPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {todayPnL >= 0 ? '+' : ''}${todayPnL.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Target className="w-4 h-4" />
              Opportunities
            </div>
            <p className="text-2xl font-bold text-purple-500">{opportunities.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border pb-4 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className="gap-2 whitespace-nowrap"
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </Button>
          );
        })}
      </div>

      {/* Dashboard Tab */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          {/* Agent Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bot className="w-5 h-5" />
                Agent Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {AGENTS.map((agent) => (
                  <div
                    key={agent.name}
                    className="bg-muted/30 rounded-lg p-4 border border-border"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{agent.name}</span>
                      <Badge
                        variant={agent.status === "running" ? "default" : "secondary"}
                        className={agent.status === "running" ? "bg-green-500" : ""}
                      >
                        {agent.status === "running" ? (
                          <><Activity className="w-3 h-3 mr-1" /> Running</>
                        ) : (
                          <><Pause className="w-3 h-3 mr-1" /> Idle</>
                        )}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{agent.description}</p>
                    <div className="text-xs">
                      <span className="text-muted-foreground">Last: </span>
                      <span>{agent.lastRun}</span>
                      {agent.nextRun && (
                        <>
                          <span className="text-muted-foreground"> • Next: </span>
                          <span>{agent.nextRun}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Opportunities */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5" />
                Top Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {opportunities.slice(0, 4).map((opp) => (
                  <div
                    key={opp.ticker}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm">{opp.ticker}</span>
                        <Badge variant="outline" className="text-xs">
                          {opp.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{opp.title}</p>
                    </div>
                    <div className="text-right ml-4">
                      <div className="font-mono font-bold">
                        {opp.yesBid}-{opp.yesAsk}¢
                      </div>
                      <div className="text-xs text-yellow-500">
                        {opp.spread}¢ spread
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Opportunities Tab */}
      {activeTab === "opportunities" && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search markets..." className="pl-10" />
            </div>
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Scan Now
            </Button>
          </div>

          <div className="space-y-3">
            {opportunities.map((opp) => (
              <Card key={opp.ticker} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-semibold">{opp.ticker}</span>
                        <Badge variant={opp.type === "SPREAD" ? "default" : "secondary"}>
                          {opp.type}
                        </Badge>
                        <Badge variant="outline">{opp.category}</Badge>
                      </div>
                      <p className="text-sm mb-2">{opp.title}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span>
                          <span className="text-muted-foreground">Spread:</span>{" "}
                          <span className="text-yellow-500 font-mono">{opp.spread}¢</span>
                        </span>
                        <span>
                          <span className="text-muted-foreground">Volume:</span>{" "}
                          <span className="font-mono">${opp.volume.toLocaleString()}</span>
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-xl font-bold">
                        {opp.yesBid}-{opp.yesAsk}¢
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" variant="outline">Analyze</Button>
                        <Button size="sm">Trade</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Trades Tab */}
      {activeTab === "trades" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Trade History</CardTitle>
            </CardHeader>
            <CardContent>
              {trades.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>No trades yet</p>
                  <p className="text-sm mt-2">Place your first trade to see it here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {trades.map((trade) => (
                    <div key={trade.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <span className="font-mono">{trade.ticker}</span>
                        <Badge className="ml-2" variant={trade.side === "yes" ? "default" : "secondary"}>
                          {trade.side.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <span className="font-mono">{trade.contracts}x @ {trade.price}¢</span>
                        {trade.pnl !== undefined && (
                          <span className={`ml-2 ${trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {trade.pnl >= 0 ? '+' : ''}{trade.pnl}¢
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Watchlist Tab */}
      {activeTab === "watchlist" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Watchlist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {watchlist.map((ticker) => {
                  const opp = opportunities.find(o => o.ticker === ticker);
                  return (
                    <div key={ticker} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
                      <div>
                        <span className="font-mono font-semibold">{ticker}</span>
                        {opp && <p className="text-sm text-muted-foreground">{opp.title}</p>}
                      </div>
                      {opp && (
                        <div className="text-right">
                          <div className="font-mono">{opp.yesBid}-{opp.yesAsk}¢</div>
                          <div className="text-xs text-yellow-500">{opp.spread}¢ spread</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Agents Tab */}
      {activeTab === "agents" && (
        <div className="space-y-4">
          {AGENTS.map((agent) => (
            <Card key={agent.name}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      agent.status === "running" ? "bg-green-500/20" : "bg-muted"
                    }`}>
                      <Bot className={`w-6 h-6 ${agent.status === "running" ? "text-green-500" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{agent.name} Agent</h3>
                      <p className="text-sm text-muted-foreground">{agent.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={agent.status === "running" ? "default" : "secondary"}
                      className={agent.status === "running" ? "bg-green-500" : ""}
                    >
                      {agent.status}
                    </Badge>
                    <Button variant="outline" size="sm">
                      {agent.status === "running" ? "Stop" : "Start"}
                    </Button>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border flex items-center gap-6 text-sm">
                  <div>
                    <span className="text-muted-foreground">Last Run:</span>{" "}
                    <span>{agent.lastRun}</span>
                  </div>
                  {agent.nextRun && (
                    <div>
                      <span className="text-muted-foreground">Next Run:</span>{" "}
                      <span>{agent.nextRun}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
