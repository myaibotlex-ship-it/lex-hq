"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase, WatchlistItem } from "@/lib/supabase";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  X,
  RefreshCw,
  Coins,
  DollarSign,
  BarChart3,
  Search,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AssetDetailModal } from "@/components/investing/AssetDetailModal";

interface PriceData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high24h?: number;
  low24h?: number;
  lastUpdated: string;
}

const assetTypeConfig = {
  metal: { icon: Coins, label: "Metal", color: "text-yellow-500", bg: "bg-yellow-500/10" },
  crypto: { icon: DollarSign, label: "Crypto", color: "text-purple-500", bg: "bg-purple-500/10" },
  stock: { icon: BarChart3, label: "Stock", color: "text-blue-500", bg: "bg-blue-500/10" },
};

const popularAssets = {
  metal: [
    { symbol: "XAU", name: "Gold" },
    { symbol: "XAG", name: "Silver" },
    { symbol: "XPT", name: "Platinum" },
    { symbol: "XPD", name: "Palladium" },
  ],
  crypto: [
    { symbol: "BTC", name: "Bitcoin" },
    { symbol: "ETH", name: "Ethereum" },
    { symbol: "SOL", name: "Solana" },
    { symbol: "DOGE", name: "Dogecoin" },
    { symbol: "ADA", name: "Cardano" },
    { symbol: "XRP", name: "XRP" },
    { symbol: "AVAX", name: "Avalanche" },
    { symbol: "LINK", name: "Chainlink" },
  ],
  stock: [
    { symbol: "SPY", name: "S&P 500 ETF" },
    { symbol: "QQQ", name: "Nasdaq 100 ETF" },
    { symbol: "AAPL", name: "Apple" },
    { symbol: "MSFT", name: "Microsoft" },
    { symbol: "GOOGL", name: "Google" },
    { symbol: "AMZN", name: "Amazon" },
    { symbol: "NVDA", name: "NVIDIA" },
    { symbol: "TSLA", name: "Tesla" },
    { symbol: "META", name: "Meta" },
    { symbol: "AMD", name: "AMD" },
  ],
};

function formatPrice(price: number, type: string): string {
  if (type === "crypto" && price < 1) {
    return `$${price.toFixed(4)}`;
  }
  return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatChange(change: number, percent: number): string {
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(2)} (${sign}${percent.toFixed(2)}%)`;
}

export default function InvestingPage() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newSymbol, setNewSymbol] = useState("");
  const [newType, setNewType] = useState<"metal" | "crypto" | "stock">("stock");
  const [newName, setNewName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<WatchlistItem | null>(null);

  const fetchWatchlist = useCallback(async () => {
    const { data, error } = await supabase
      .from("watchlist")
      .select("*")
      .order("sort_order", { ascending: true });

    if (!error && data) {
      setWatchlist(data);
    }
  }, []);

  const fetchPrices = useCallback(async () => {
    if (watchlist.length === 0) return;

    setRefreshing(true);
    try {
      const symbols = watchlist.map((w) => w.symbol).join(",");
      const types = [...new Set(watchlist.map((w) => w.asset_type))].join(",");

      const res = await fetch(`/api/prices?symbols=${symbols}&types=${types}`);
      const data = await res.json();

      if (data.prices) {
        setPrices(data.prices);
        setLastRefresh(new Date());
      }
    } catch (error) {
      console.error("Failed to fetch prices:", error);
    } finally {
      setRefreshing(false);
    }
  }, [watchlist]);

  useEffect(() => {
    fetchWatchlist().then(() => setLoading(false));
  }, [fetchWatchlist]);

  useEffect(() => {
    if (watchlist.length > 0) {
      fetchPrices();
      // Auto-refresh every 60 seconds
      const interval = setInterval(fetchPrices, 60000);
      return () => clearInterval(interval);
    }
  }, [watchlist, fetchPrices]);

  const addToWatchlist = async (symbol: string, type: "metal" | "crypto" | "stock", name: string) => {
    const { error } = await supabase.from("watchlist").insert({
      symbol: symbol.toUpperCase(),
      asset_type: type,
      display_name: name,
      sort_order: watchlist.length + 1,
    });

    if (!error) {
      fetchWatchlist();
      setDialogOpen(false);
      setNewSymbol("");
      setNewName("");
      setSearchQuery("");
    }
  };

  const removeFromWatchlist = async (id: string) => {
    const { error } = await supabase.from("watchlist").delete().eq("id", id);
    if (!error) {
      setWatchlist((prev) => prev.filter((w) => w.id !== id));
    }
  };

  const filteredPopularAssets = Object.entries(popularAssets).flatMap(([type, assets]) =>
    assets
      .filter(
        (a) =>
          (a.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.name.toLowerCase().includes(searchQuery.toLowerCase())) &&
          !watchlist.some((w) => w.symbol === a.symbol && w.asset_type === type)
      )
      .map((a) => ({ ...a, type: type as "metal" | "crypto" | "stock" }))
  );

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="skeleton h-8 w-48 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton h-32 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">Investing</h1>
          <p className="text-zinc-500 text-sm">
            Track your watchlist • {lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString()}` : "Loading..."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPrices}
            disabled={refreshing}
            className="bg-zinc-800/50 border-zinc-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-primary-glow" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Asset
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800">
              <DialogHeader>
                <DialogTitle>Add to Watchlist</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {/* Quick Add from Popular */}
                <div>
                  <label className="text-sm text-zinc-400 mb-2 block">Quick Add</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input
                      placeholder="Search assets..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 bg-zinc-800 border-zinc-700"
                    />
                  </div>
                  <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
                    {filteredPopularAssets.slice(0, 8).map((asset) => {
                      const config = assetTypeConfig[asset.type];
                      return (
                        <button
                          key={`${asset.type}-${asset.symbol}`}
                          onClick={() => addToWatchlist(asset.symbol, asset.type, asset.name)}
                          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-zinc-800 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded flex items-center justify-center ${config.bg}`}>
                              <config.icon className={`w-3 h-3 ${config.color}`} />
                            </div>
                            <span className="font-medium">{asset.symbol}</span>
                            <span className="text-zinc-500 text-sm">{asset.name}</span>
                          </div>
                          <Plus className="w-4 h-4 text-zinc-500" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-zinc-800 pt-4">
                  <label className="text-sm text-zinc-400 mb-2 block">Or Add Custom</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Symbol (e.g. AAPL)"
                      value={newSymbol}
                      onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                      className="bg-zinc-800 border-zinc-700"
                    />
                    <Select value={newType} onValueChange={(v) => setNewType(v as typeof newType)}>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800">
                        <SelectItem value="stock">Stock</SelectItem>
                        <SelectItem value="crypto">Crypto</SelectItem>
                        <SelectItem value="metal">Metal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    placeholder="Display Name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="mt-2 bg-zinc-800 border-zinc-700"
                  />
                  <Button
                    onClick={() => addToWatchlist(newSymbol, newType, newName || newSymbol)}
                    disabled={!newSymbol}
                    className="w-full mt-2"
                  >
                    Add {newSymbol || "Asset"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Watchlist Grid */}
      {watchlist.length === 0 ? (
        <Card className="bg-zinc-900/80 border-zinc-800">
          <CardContent className="py-12 text-center">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-zinc-600" />
            <p className="text-zinc-400 mb-4">Your watchlist is empty</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Asset
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {watchlist.map((item, index) => {
            const price = prices[item.symbol];
            const config = assetTypeConfig[item.asset_type];
            const isPositive = price ? price.change >= 0 : true;

            return (
              <Card
                key={item.id}
                className="bg-zinc-900/80 border-zinc-800 card-glow animate-fade-in opacity-0 group relative cursor-pointer hover:border-zinc-600 transition-colors"
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => setSelectedAsset(item)}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromWatchlist(item.id);
                  }}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-zinc-800 rounded z-10"
                >
                  <X className="w-4 h-4 text-zinc-500" />
                </button>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.bg}`}>
                      <config.icon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{item.symbol}</CardTitle>
                      <p className="text-xs text-zinc-500">{item.display_name}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {price ? (
                    <>
                      <div className="text-2xl font-bold font-terminal mb-1">
                        {formatPrice(price.price, item.asset_type)}
                      </div>
                      <div className={`flex items-center gap-1 text-sm ${isPositive ? "text-green-400" : "text-red-400"}`}>
                        {isPositive ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        <span>{formatChange(price.change, price.changePercent)}</span>
                      </div>
                      {price.high24h && price.low24h && (
                        <div className="flex gap-3 mt-2 text-xs text-zinc-500">
                          <span>H: {formatPrice(price.high24h, item.asset_type)}</span>
                          <span>L: {formatPrice(price.low24h, item.asset_type)}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-zinc-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Loading...</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Asset Type Legend */}
      <div className="mt-6 flex flex-wrap gap-4 justify-center text-sm text-zinc-500">
        {Object.entries(assetTypeConfig).map(([type, config]) => (
          <div key={type} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded flex items-center justify-center ${config.bg}`}>
              <config.icon className={`w-3 h-3 ${config.color}`} />
            </div>
            <span>{config.label}</span>
          </div>
        ))}
      </div>

      {/* Asset Detail Modal */}
      {selectedAsset && (
        <AssetDetailModal
          open={!!selectedAsset}
          onClose={() => setSelectedAsset(null)}
          symbol={selectedAsset.symbol}
          displayName={selectedAsset.display_name}
          assetType={selectedAsset.asset_type}
          currentPrice={prices[selectedAsset.symbol]?.price}
          change={prices[selectedAsset.symbol]?.change}
          changePercent={prices[selectedAsset.symbol]?.changePercent}
        />
      )}
    </div>
  );
}
