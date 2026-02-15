import { NextResponse } from "next/server";

interface PriceData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high24h?: number;
  low24h?: number;
  lastUpdated: string;
}

// Fetch metal prices using Yahoo Finance chart API (GLD/SLV ETFs as proxies)
async function fetchMetalPrices(): Promise<Record<string, PriceData>> {
  try {
    // Map metal symbols to ETF tickers and conversion factors
    const metalMap: Record<string, { etf: string; factor: number }> = {
      XAU: { etf: "GLD", factor: 10 }, // GLD ≈ 1/10 oz gold
      XAG: { etf: "SLV", factor: 1 },  // SLV tracks silver price closely
    };
    
    const prices: Record<string, PriceData> = {};
    
    for (const [symbol, { etf, factor }] of Object.entries(metalMap)) {
      try {
        const res = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${etf}?interval=1d&range=2d`,
          {
            next: { revalidate: 60 },
            headers: { "User-Agent": "Mozilla/5.0" },
          }
        );
        
        if (!res.ok) continue;
        const data = await res.json();
        
        const result = data.chart?.result?.[0];
        if (!result) continue;
        
        const meta = result.meta;
        const quotes = result.indicators?.quote?.[0];
        
        // Get current and previous close
        const currentPrice = meta.regularMarketPrice * factor;
        const previousClose = meta.chartPreviousClose * factor;
        const change = currentPrice - previousClose;
        const changePercent = (change / previousClose) * 100;
        
        prices[symbol] = {
          symbol,
          price: currentPrice,
          change,
          changePercent,
          high24h: meta.regularMarketDayHigh * factor,
          low24h: meta.regularMarketDayLow * factor,
          lastUpdated: new Date().toISOString(),
        };
      } catch (err) {
        console.error(`Failed to fetch ${symbol}:`, err);
      }
    }
    
    return prices;
  } catch (error) {
    console.error("Metal prices fetch error:", error);
    return {};
  }
}

// Fetch crypto prices from CoinGecko
async function fetchCryptoPrices(symbols: string[]): Promise<Record<string, PriceData>> {
  try {
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
    
    const coinIds = symbols
      .map((s) => coinMap[s.toUpperCase()])
      .filter(Boolean)
      .join(",");
    
    if (!coinIds) return {};
    
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`,
      { next: { revalidate: 60 } }
    );
    
    if (!res.ok) throw new Error("CoinGecko API failed");
    const data = await res.json();
    
    const prices: Record<string, PriceData> = {};
    
    for (const [symbol, coinId] of Object.entries(coinMap)) {
      if (data[coinId]) {
        const price = data[coinId].usd;
        const changePercent = data[coinId].usd_24h_change || 0;
        prices[symbol] = {
          symbol,
          price,
          change: (price * changePercent) / 100,
          changePercent,
          lastUpdated: new Date().toISOString(),
        };
      }
    }
    
    return prices;
  } catch (error) {
    console.error("Crypto prices fetch error:", error);
    return {};
  }
}

// Fetch stock prices from Yahoo Finance (via chart API)
async function fetchStockPrices(symbols: string[]): Promise<Record<string, PriceData>> {
  const prices: Record<string, PriceData> = {};
  
  // Fetch each symbol individually using chart API
  await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const res = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=2d`,
          {
            next: { revalidate: 60 },
            headers: { "User-Agent": "Mozilla/5.0" },
          }
        );
        
        if (!res.ok) return;
        const data = await res.json();
        
        const result = data.chart?.result?.[0];
        if (!result) return;
        
        const meta = result.meta;
        const currentPrice = meta.regularMarketPrice;
        const previousClose = meta.chartPreviousClose;
        const change = currentPrice - previousClose;
        const changePercent = (change / previousClose) * 100;
        
        prices[symbol] = {
          symbol,
          price: currentPrice,
          change,
          changePercent,
          high24h: meta.regularMarketDayHigh,
          low24h: meta.regularMarketDayLow,
          lastUpdated: new Date().toISOString(),
        };
      } catch (err) {
        console.error(`Failed to fetch ${symbol}:`, err);
      }
    })
  );
  
  return prices;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbols = searchParams.get("symbols")?.split(",") || [];
  const types = searchParams.get("types")?.split(",") || ["metal", "crypto", "stock"];
  
  const allPrices: Record<string, PriceData> = {};
  
  // Fetch in parallel
  const [metalPrices, cryptoPrices, stockPrices] = await Promise.all([
    types.includes("metal") ? fetchMetalPrices() : Promise.resolve({}),
    types.includes("crypto")
      ? fetchCryptoPrices(symbols.filter((s) => ["BTC", "ETH", "SOL", "DOGE", "ADA", "XRP", "DOT", "LINK", "AVAX", "MATIC"].includes(s.toUpperCase())))
      : Promise.resolve({}),
    types.includes("stock")
      ? fetchStockPrices(symbols.filter((s) => !["BTC", "ETH", "SOL", "DOGE", "XAU", "XAG", "XPT", "XPD"].includes(s.toUpperCase())))
      : Promise.resolve({}),
  ]);
  
  Object.assign(allPrices, metalPrices, cryptoPrices, stockPrices);
  
  return NextResponse.json({
    prices: allPrices,
    timestamp: new Date().toISOString(),
  });
}
