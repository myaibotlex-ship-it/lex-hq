"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase, WatchlistItem, Position } from "@/lib/supabase";
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
  Briefcase,
  Eye,
  Edit2,
  Trash2,
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

type TabId = "positions" | "watchlist";

const assetTypeConfig = {
  metal: { icon: Coins, label: "Metal", color: "text-yellow-500", bg: "bg-yellow-500/10" },
  crypto: { icon: DollarSign, label: "Crypto", color: "text-purple-500", bg: "bg-purple-500/10" },
  stock: { icon: BarChart3, label: "Stock", color: "text-blue-500", bg: "bg-blue-500/10" },
};

const unitOptions: Record<string, string[]> = {
  metal: ["oz", "g", "kg", "coins"],
  crypto: ["coins", "tokens"],
  stock: ["shares"],
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

function formatCurrency(value: number): string {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function InvestingPage() {
  const [activeTab, setActiveTab] = useState<TabId>("positions");
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  // Watchlist dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newSymbol, setNewSymbol] = useState("");
  const [newType, setNewType] = useState<"metal" | "crypto" | "stock">("stock");
  const [newName, setNewName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<WatchlistItem | null>(null);

  // Position dialog
  const [positionDialogOpen, setPositionDialogOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [positionForm, setPositionForm] = useState({
    symbol: "",
    assetType: "metal" as "metal" | "crypto" | "stock",
    displayName: "",
    quantity: "",
    unit: "oz",
    costBasis: "",
    purchaseDate: "",
    notes: "",
  });

  const fetchWatchlist = useCallback(async () => {
    const { data, error } = await supabase
      .from("watchlist")
      .select("*")
      .order("sort_order", { ascending: true });

    if (!error && data) {
      setWatchlist(data);
    }
  }, []);

  const fetchPositions = useCallback(async () => {
    const { data, error } = await supabase
      .from("positions")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPositions(data);
    }
  }, []);

  const fetchPrices = useCallback(async () => {
    // Combine symbols from watchlist and positions
    const watchlistSymbols = watchlist.map((w) => w.symbol);
    const positionSymbols = positions.map((p) => p.symbol);
    const allSymbols = [...new Set([...watchlistSymbols, ...positionSymbols])];
    
    if (allSymbols.length === 0) return;

    setRefreshing(true);
    try {
      // Get all unique types
      const watchlistTypes = watchlist.map((w) => w.asset_type);
      const positionTypes = positions.map((p) => p.asset_type);
      const allTypes = [...new Set([...watchlistTypes, ...positionTypes])];

      const symbols = allSymbols.join(",");
      const types = allTypes.join(",");

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
  }, [watchlist, positions]);

  useEffect(() => {
    Promise.all([fetchWatchlist(), fetchPositions()]).then(() => setLoading(false));
  }, [fetchWatchlist, fetchPositions]);

  useEffect(() => {
    const allSymbols = [...watchlist.map(w => w.symbol), ...positions.map(p => p.symbol)];
    if (allSymbols.length > 0) {
      fetchPrices();
      const interval = setInterval(fetchPrices, 60000);
      return () => clearInterval(interval);
    }
  }, [watchlist, positions, fetchPrices]);

  // Watchlist functions
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

  // Position functions
  const resetPositionForm = () => {
    setPositionForm({
      symbol: "",
      assetType: "metal",
      displayName: "",
      quantity: "",
      unit: "oz",
      costBasis: "",
      purchaseDate: "",
      notes: "",
    });
    setEditingPosition(null);
  };

  const openAddPosition = () => {
    resetPositionForm();
    setPositionDialogOpen(true);
  };

  const openEditPosition = (position: Position) => {
    setEditingPosition(position);
    setPositionForm({
      symbol: position.symbol,
      assetType: position.asset_type,
      displayName: position.display_name,
      quantity: position.quantity.toString(),
      unit: position.unit,
      costBasis: position.cost_basis.toString(),
      purchaseDate: position.purchase_date || "",
      notes: position.notes || "",
    });
    setPositionDialogOpen(true);
  };

  const savePosition = async () => {
    const positionData = {
      symbol: positionForm.symbol.toUpperCase(),
      asset_type: positionForm.assetType,
      display_name: positionForm.displayName || positionForm.symbol.toUpperCase(),
      quantity: parseFloat(positionForm.quantity),
      unit: positionForm.unit,
      cost_basis: parseFloat(positionForm.costBasis),
      purchase_date: positionForm.purchaseDate || null,
      notes: positionForm.notes || null,
      updated_at: new Date().toISOString(),
    };

    if (editingPosition) {
      const { error } = await supabase
        .from("positions")
        .update(positionData)
        .eq("id", editingPosition.id);
      
      if (!error) {
        fetchPositions();
        setPositionDialogOpen(false);
        resetPositionForm();
      }
    } else {
      const { error } = await supabase.from("positions").insert(positionData);
      
      if (!error) {
        fetchPositions();
        setPositionDialogOpen(false);
        resetPositionForm();
      }
    }
  };

  const deletePosition = async (id: string) => {
    const { error } = await supabase.from("positions").delete().eq("id", id);
    if (!error) {
      setPositions((prev) => prev.filter((p) => p.id !== id));
    }
  };

  // Calculate portfolio totals
  const portfolioStats = positions.reduce(
    (acc, position) => {
      const price = prices[position.symbol];
      const totalCost = position.quantity * position.cost_basis;
      const currentValue = price ? position.quantity * price.price : totalCost;
      const pnl = currentValue - totalCost;

      return {
        totalCost: acc.totalCost + totalCost,
        currentValue: acc.currentValue + currentValue,
        totalPnL: acc.totalPnL + pnl,
      };
    },
    { totalCost: 0, currentValue: 0, totalPnL: 0 }
  );

  const portfolioPnLPercent = portfolioStats.totalCost > 0 
    ? (portfolioStats.totalPnL / portfolioStats.totalCost) * 100 
    : 0;

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
          <p className="text-muted-foreground text-sm">
            Track positions & watchlist • {lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString()}` : "Loading..."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPrices}
            disabled={refreshing}
            className="bg-secondary border-border"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Portfolio Summary */}
      {positions.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Total Cost</p>
              <p className="text-2xl font-bold font-mono">{formatCurrency(portfolioStats.totalCost)}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Current Value</p>
              <p className="text-2xl font-bold font-mono">{formatCurrency(portfolioStats.currentValue)}</p>
            </CardContent>
          </Card>
          <Card className={`bg-gradient-to-br ${portfolioStats.totalPnL >= 0 ? 'from-green-500/10 to-emerald-500/10 border-green-500/20' : 'from-red-500/10 to-rose-500/10 border-red-500/20'}`}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Unrealized P&L</p>
              <p className={`text-2xl font-bold font-mono ${portfolioStats.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {portfolioStats.totalPnL >= 0 ? '+' : ''}{formatCurrency(portfolioStats.totalPnL)}
              </p>
            </CardContent>
          </Card>
          <Card className={`bg-gradient-to-br ${portfolioPnLPercent >= 0 ? 'from-green-500/10 to-emerald-500/10 border-green-500/20' : 'from-red-500/10 to-rose-500/10 border-red-500/20'}`}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Return %</p>
              <p className={`text-2xl font-bold font-mono ${portfolioPnLPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {portfolioPnLPercent >= 0 ? '+' : ''}{portfolioPnLPercent.toFixed(2)}%
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border pb-4">
        <Button
          variant={activeTab === "positions" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("positions")}
          className="gap-2"
        >
          <Briefcase className="w-4 h-4" />
          Positions ({positions.length})
        </Button>
        <Button
          variant={activeTab === "watchlist" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("watchlist")}
          className="gap-2"
        >
          <Eye className="w-4 h-4" />
          Watchlist ({watchlist.length})
        </Button>
      </div>

      {/* Positions Tab */}
      {activeTab === "positions" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openAddPosition} className="btn-primary-glow" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Position
            </Button>
          </div>

          {positions.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="py-12 text-center">
                <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">No positions yet</p>
                <Button onClick={openAddPosition}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Position
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {positions.map((position, index) => {
                const price = prices[position.symbol];
                const config = assetTypeConfig[position.asset_type];
                const totalCost = position.quantity * position.cost_basis;
                const currentValue = price ? position.quantity * price.price : totalCost;
                const pnl = currentValue - totalCost;
                const pnlPercent = totalCost > 0 ? (pnl / totalCost) * 100 : 0;
                const isPositive = pnl >= 0;

                return (
                  <Card
                    key={position.id}
                    className="bg-card border-border hover:border-border transition-colors animate-fade-in opacity-0"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${config.bg}`}>
                            <config.icon className={`w-6 h-6 ${config.color}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-lg">{position.symbol}</span>
                              <Badge variant="outline" className="text-xs">{position.display_name}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {position.quantity} {position.unit} @ {formatCurrency(position.cost_basis)}/{position.unit}
                            </p>
                            {position.notes && (
                              <p className="text-xs text-muted-foreground mt-1">{position.notes}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-start gap-4">
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">Cost Basis</div>
                            <div className="font-mono font-bold">{formatCurrency(totalCost)}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">Current Value</div>
                            <div className="font-mono font-bold">
                              {price ? formatCurrency(currentValue) : <Loader2 className="w-4 h-4 animate-spin inline" />}
                            </div>
                          </div>
                          <div className="text-right min-w-[100px]">
                            <div className="text-sm text-muted-foreground">P&L</div>
                            {price ? (
                              <div className={`font-mono font-bold flex items-center justify-end gap-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                {isPositive ? '+' : ''}{formatCurrency(pnl)}
                                <span className="text-xs">({isPositive ? '+' : ''}{pnlPercent.toFixed(1)}%)</span>
                              </div>
                            ) : (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditPosition(position)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deletePosition(position.id)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Watchlist Tab */}
      {activeTab === "watchlist" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="btn-primary-glow" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Asset
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle>Add to Watchlist</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  {/* Quick Add from Popular */}
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Quick Add</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search assets..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-secondary border-border"
                      />
                    </div>
                    <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
                      {filteredPopularAssets.slice(0, 8).map((asset) => {
                        const config = assetTypeConfig[asset.type];
                        return (
                          <button
                            key={`${asset.type}-${asset.symbol}`}
                            onClick={() => addToWatchlist(asset.symbol, asset.type, asset.name)}
                            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-secondary transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-6 h-6 rounded flex items-center justify-center ${config.bg}`}>
                                <config.icon className={`w-3 h-3 ${config.color}`} />
                              </div>
                              <span className="font-medium">{asset.symbol}</span>
                              <span className="text-muted-foreground text-sm">{asset.name}</span>
                            </div>
                            <Plus className="w-4 h-4 text-muted-foreground" />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
                    <label className="text-sm text-muted-foreground mb-2 block">Or Add Custom</label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Symbol (e.g. AAPL)"
                        value={newSymbol}
                        onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                        className="bg-secondary border-border"
                      />
                      <Select value={newType} onValueChange={(v) => setNewType(v as typeof newType)}>
                        <SelectTrigger className="bg-secondary border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
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
                      className="mt-2 bg-secondary border-border"
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

          {watchlist.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="py-12 text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">Your watchlist is empty</p>
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
                    className="bg-card border-border card-glow animate-fade-in opacity-0 group relative cursor-pointer hover:border-border transition-colors"
                    style={{ animationDelay: `${index * 0.05}s` }}
                    onClick={() => setSelectedAsset(item)}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromWatchlist(item.id);
                      }}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-secondary rounded z-10"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.bg}`}>
                          <config.icon className={`w-5 h-5 ${config.color}`} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{item.symbol}</CardTitle>
                          <p className="text-xs text-muted-foreground">{item.display_name}</p>
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
                            <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                              <span>H: {formatPrice(price.high24h, item.asset_type)}</span>
                              <span>L: {formatPrice(price.low24h, item.asset_type)}</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center gap-2 text-muted-foreground">
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
        </div>
      )}

      {/* Asset Type Legend */}
      <div className="mt-6 flex flex-wrap gap-4 justify-center text-sm text-muted-foreground">
        {Object.entries(assetTypeConfig).map(([type, config]) => (
          <div key={type} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded flex items-center justify-center ${config.bg}`}>
              <config.icon className={`w-3 h-3 ${config.color}`} />
            </div>
            <span>{config.label}</span>
          </div>
        ))}
      </div>

      {/* Position Dialog */}
      <Dialog open={positionDialogOpen} onOpenChange={setPositionDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>{editingPosition ? "Edit Position" : "Add Position"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Symbol</label>
                <Input
                  placeholder="XAG, BTC, AAPL..."
                  value={positionForm.symbol}
                  onChange={(e) => setPositionForm({ ...positionForm, symbol: e.target.value.toUpperCase() })}
                  className="bg-secondary border-border"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Type</label>
                <Select 
                  value={positionForm.assetType} 
                  onValueChange={(v) => {
                    const type = v as "metal" | "crypto" | "stock";
                    setPositionForm({ 
                      ...positionForm, 
                      assetType: type,
                      unit: unitOptions[type][0]
                    });
                  }}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="metal">Metal</SelectItem>
                    <SelectItem value="crypto">Crypto</SelectItem>
                    <SelectItem value="stock">Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Display Name</label>
              <Input
                placeholder="Silver, Bitcoin, Apple..."
                value={positionForm.displayName}
                onChange={(e) => setPositionForm({ ...positionForm, displayName: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Quantity</label>
                <Input
                  type="number"
                  placeholder="25"
                  value={positionForm.quantity}
                  onChange={(e) => setPositionForm({ ...positionForm, quantity: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Unit</label>
                <Select 
                  value={positionForm.unit} 
                  onValueChange={(v) => setPositionForm({ ...positionForm, unit: v })}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {unitOptions[positionForm.assetType].map((unit) => (
                      <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Cost per Unit</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="31.13"
                  value={positionForm.costBasis}
                  onChange={(e) => setPositionForm({ ...positionForm, costBasis: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Purchase Date (optional)</label>
              <Input
                type="date"
                value={positionForm.purchaseDate}
                onChange={(e) => setPositionForm({ ...positionForm, purchaseDate: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Notes (optional)</label>
              <Input
                placeholder="Physical silver, held in vault..."
                value={positionForm.notes}
                onChange={(e) => setPositionForm({ ...positionForm, notes: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>

            {positionForm.quantity && positionForm.costBasis && (
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Cost Basis</span>
                  <span className="font-mono font-bold">
                    {formatCurrency(parseFloat(positionForm.quantity) * parseFloat(positionForm.costBasis))}
                  </span>
                </div>
              </div>
            )}

            <Button
              onClick={savePosition}
              disabled={!positionForm.symbol || !positionForm.quantity || !positionForm.costBasis}
              className="w-full"
            >
              {editingPosition ? "Update Position" : "Add Position"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
