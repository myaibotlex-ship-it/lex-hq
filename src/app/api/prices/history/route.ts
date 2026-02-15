import { NextResponse } from "next/server";

interface HistoryPoint {
  timestamp: number;
  price: number;
  date: string;
}

// Fetch crypto history from CoinGecko
async function fetchCryptoHistory(symbol: string, days: number = 7): Promise<HistoryPoint[]> {
  const coinMap: Record<string, string> = {
    BTC: "bitcoin",
    ETH: "ethereum",
    SOL: "solana",
    DOGE: "dogecoin",
    ADA: "cardano",
    XRP: "ripple",
    DOT: "polkadot",
    LINK: "chainlink",
    AVAX: "avalanche-2",
    MATIC: "matic-network",
  };

  const coinId = coinMap[symbol.toUpperCase()];
  if (!coinId) return [];

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`,
      { next: { revalidate: 300 } }
    );
    
    if (!res.ok) throw new Error("CoinGecko history API failed");
    const data = await res.json();

    return data.prices.map(([timestamp, price]: [number, number]) => ({
      timestamp,
      price,
      date: new Date(timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    }));
  } catch (error) {
    console.error("Crypto history fetch error:", error);
    return [];
  }
}

// Fetch stock history from Yahoo Finance
async function fetchStockHistory(symbol: string, days: number = 7): Promise<HistoryPoint[]> {
  try {
    const period1 = Math.floor((Date.now() - days * 24 * 60 * 60 * 1000) / 1000);
    const period2 = Math.floor(Date.now() / 1000);
    
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${period1}&period2=${period2}&interval=1d`,
      {
        next: { revalidate: 300 },
        headers: { "User-Agent": "Mozilla/5.0" },
      }
    );
    
    if (!res.ok) throw new Error("Yahoo Finance history API failed");
    const data = await res.json();
    
    const timestamps = data.chart?.result?.[0]?.timestamp || [];
    const prices = data.chart?.result?.[0]?.indicators?.quote?.[0]?.close || [];
    
    return timestamps.map((ts: number, i: number) => ({
      timestamp: ts * 1000,
      price: prices[i] || 0,
      date: new Date(ts * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    })).filter((p: HistoryPoint) => p.price > 0);
  } catch (error) {
    console.error("Stock history fetch error:", error);
    return [];
  }
}

// Fetch metal history using Yahoo Finance chart API (GLD/SLV ETFs)
async function fetchMetalHistory(symbol: string, days: number = 7): Promise<HistoryPoint[]> {
  try {
    const metalMap: Record<string, { etf: string; factor: number }> = {
      XAU: { etf: "GLD", factor: 10 },
      XAG: { etf: "SLV", factor: 1 },
    };
    
    const config = metalMap[symbol];
    if (!config) return [];
    
    const period1 = Math.floor((Date.now() - days * 24 * 60 * 60 * 1000) / 1000);
    const period2 = Math.floor(Date.now() / 1000);
    
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${config.etf}?period1=${period1}&period2=${period2}&interval=1d`,
      {
        next: { revalidate: 300 },
        headers: { "User-Agent": "Mozilla/5.0" },
      }
    );
    
    if (!res.ok) throw new Error("Yahoo Finance metal history API failed");
    const data = await res.json();
    
    const timestamps = data.chart?.result?.[0]?.timestamp || [];
    const prices = data.chart?.result?.[0]?.indicators?.quote?.[0]?.close || [];
    
    return timestamps.map((ts: number, i: number) => ({
      timestamp: ts * 1000,
      price: (prices[i] || 0) * config.factor,
      date: new Date(ts * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    })).filter((p: HistoryPoint) => p.price > 0);
  } catch (error) {
    console.error("Metal history fetch error:", error);
    return [];
  }
}

// Get additional market data for crypto
async function fetchCryptoDetails(symbol: string) {
  const coinMap: Record<string, string> = {
    BTC: "bitcoin",
    ETH: "ethereum",
    SOL: "solana",
    DOGE: "dogecoin",
    ADA: "cardano",
    XRP: "ripple",
  };

  const coinId = coinMap[symbol.toUpperCase()];
  if (!coinId) return null;

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false`,
      { next: { revalidate: 300 } }
    );
    
    if (!res.ok) return null;
    const data = await res.json();
    
    return {
      marketCap: data.market_data?.market_cap?.usd,
      volume24h: data.market_data?.total_volume?.usd,
      high24h: data.market_data?.high_24h?.usd,
      low24h: data.market_data?.low_24h?.usd,
      ath: data.market_data?.ath?.usd,
      athDate: data.market_data?.ath_date?.usd,
      athChangePercent: data.market_data?.ath_change_percentage?.usd,
      circulatingSupply: data.market_data?.circulating_supply,
      totalSupply: data.market_data?.total_supply,
    };
  } catch (error) {
    console.error("Crypto details fetch error:", error);
    return null;
  }
}

// Get additional market data for stocks (using chart API meta)
async function fetchStockDetails(symbol: string) {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1y`,
      {
        next: { revalidate: 300 },
        headers: { "User-Agent": "Mozilla/5.0" },
      }
    );
    
    if (!res.ok) return null;
    const data = await res.json();
    const meta = data.chart?.result?.[0]?.meta;
    
    if (!meta) return null;
    
    return {
      volume24h: meta.regularMarketVolume,
      high24h: meta.regularMarketDayHigh,
      low24h: meta.regularMarketDayLow,
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
      previousClose: meta.chartPreviousClose,
    };
  } catch (error) {
    console.error("Stock details fetch error:", error);
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol")?.toUpperCase() || "";
  const type = searchParams.get("type") || "stock";
  const days = parseInt(searchParams.get("days") || "7");

  let history: HistoryPoint[] = [];
  let details = null;

  if (type === "crypto") {
    [history, details] = await Promise.all([
      fetchCryptoHistory(symbol, days),
      fetchCryptoDetails(symbol),
    ]);
  } else if (type === "stock") {
    [history, details] = await Promise.all([
      fetchStockHistory(symbol, days),
      fetchStockDetails(symbol),
    ]);
  } else if (type === "metal") {
    history = await fetchMetalHistory(symbol, days);
  }

  return NextResponse.json({
    symbol,
    type,
    history,
    details,
    timestamp: new Date().toISOString(),
  });
}
