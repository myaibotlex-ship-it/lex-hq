'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Clock, DollarSign, Activity, RefreshCw } from 'lucide-react';

interface Trade {
  id: string;
  ticker: string;
  side: string;
  count: number;
  price: number;
  reason: string;
  btc_price: number;
  status: string;
  pnl: number | null;
  created_at: string;
}

export default function TradesPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTrades: 0,
    totalVolume: 0,
    totalPnL: 0,
    winRate: 0
  });

  const fetchTrades = async () => {
    try {
      const res = await fetch('/api/kalshi/trade');
      const data = await res.json();
      if (data.success) {
        setTrades(data.trades || []);
        
        // Calculate stats
        const totalTrades = data.trades?.length || 0;
        const totalVolume = data.trades?.reduce((sum: number, t: Trade) => sum + (t.count * (t.price || 0)), 0) || 0;
        const settledTrades = data.trades?.filter((t: Trade) => t.pnl !== null) || [];
        const totalPnL = settledTrades.reduce((sum: number, t: Trade) => sum + (t.pnl || 0), 0);
        const wins = settledTrades.filter((t: Trade) => (t.pnl || 0) > 0).length;
        const winRate = settledTrades.length > 0 ? (wins / settledTrades.length) * 100 : 0;
        
        setStats({ totalTrades, totalVolume, totalPnL, winRate });
      }
    } catch (e) {
      console.error('Failed to fetch trades:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrades();
    const interval = setInterval(fetchTrades, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const extractStrike = (ticker: string) => {
    const match = ticker.match(/T(\d+)/);
    return match ? `$${parseInt(match[1]).toLocaleString()}` : ticker;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">BTC Auto-Trader</h1>
          <p className="text-muted-foreground">Kalshi latency arbitrage trades</p>
        </div>
        <button 
          onClick={fetchTrades}
          className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Trades</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.totalTrades}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Volume</span>
            </div>
            <p className="text-2xl font-bold mt-1">${(stats.totalVolume / 100).toFixed(2)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              {stats.totalPnL >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span className="text-sm text-muted-foreground">P&L</span>
            </div>
            <p className={`text-2xl font-bold mt-1 ${stats.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ${stats.totalPnL.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Win Rate</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.winRate.toFixed(0)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Trades Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Trades</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : trades.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No trades yet</p>
              <p className="text-sm">Trades will appear here when the bot executes</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Time</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Side</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Strike</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Contracts</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Price</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">BTC</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((trade) => (
                    <tr key={trade.id} className="border-b border-border/50 hover:bg-secondary/30">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          {formatTime(trade.created_at)}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant={trade.side === 'yes' ? 'default' : 'secondary'}>
                          {trade.side.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 font-mono text-sm">
                        {extractStrike(trade.ticker)}
                      </td>
                      <td className="py-3 px-2 text-right font-mono">
                        {trade.count}
                      </td>
                      <td className="py-3 px-2 text-right font-mono">
                        {trade.price}¢
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-sm text-muted-foreground">
                        ${trade.btc_price?.toLocaleString()}
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant={
                          trade.status === 'filled' ? 'default' :
                          trade.status === 'submitted' ? 'secondary' :
                          'destructive'
                        }>
                          {trade.status}
                        </Badge>
                      </td>
                      <td className={`py-3 px-2 text-right font-mono ${
                        trade.pnl === null ? 'text-muted-foreground' :
                        trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {trade.pnl === null ? '—' : `$${trade.pnl.toFixed(2)}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
