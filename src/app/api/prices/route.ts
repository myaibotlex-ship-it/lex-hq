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

// Fetch metal prices from metals.live
async function fetchMetalPrices(): Promise<Record<string, PriceData>> {
  try {
    const res = await fetch("https://api.metals.live/v1/spot", {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error("Metals API failed");
    const data = await res.json();
    
    const prices: Record<string, PriceData> = {};
    
    // metals.live returns array of [timestamp, gold, silver, platinum, palladium]
    if (Array.isArray(data) && data.length > 0) {
      const latest = data[data.length - 1];
      const previous = data.length > 1 ? data[data.length - 2] : latest;
      
      const goldPrice = latest.gold || latest[1];
      const silverPrice = latest.silver || latest[2];
      const platinumPrice = latest.platinum || latest[3];
      const palladiumPrice = latest.palladium || latest[4];
      
      const prevGold = previous.gold || previous[1];
      const prevSilver = previous.silver || previous[2];
      
      prices["XAU"] = {
        symbol: "XAU",
        price: goldPrice,
        change: goldPrice - prevGold,
        changePercent: ((goldPrice - prevGold) / prevGold) * 100,
        lastUpdated: new Date().toISOString(),
      };
      
      prices["XAG"] = {
        symbol: "XAG",
        price: silverPrice,
        change: silverPrice - prevSilver,
        changePercent: ((silverPrice - prevSilver) / prevSilver) * 100,
        lastUpdated: new Date().toISOString(),
      };
      
      if (platinumPrice) {
        prices["XPT"] = {
          symbol: "XPT",
          price: platinumPrice,
          change: 0,
          changePercent: 0,
          lastUpdated: new Date().toISOString(),
        };
      }
      
      if (palladiumPrice) {
        prices["XPD"] = {
          symbol: "XPD",
          price: palladiumPrice,
          change: 0,
          changePercent: 0,
          lastUpdated: new Date().toISOString(),
        };
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

// Fetch stock prices from Yahoo Finance (via query)
async function fetchStockPrices(symbols: string[]): Promise<Record<string, PriceData>> {
  try {
    const prices: Record<string, PriceData> = {};
    
    // Use Yahoo Finance v7 API
    const symbolStr = symbols.join(",");
    const res = await fetch(
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbolStr}`,
      {
        next: { revalidate: 60 },
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
      }
    );
    
    if (!res.ok) throw new Error("Yahoo Finance API failed");
    const data = await res.json();
    
    if (data.quoteResponse?.result) {
      for (const quote of data.quoteResponse.result) {
        prices[quote.symbol] = {
          symbol: quote.symbol,
          price: quote.regularMarketPrice || 0,
          change: quote.regularMarketChange || 0,
          changePercent: quote.regularMarketChangePercent || 0,
          high24h: quote.regularMarketDayHigh,
          low24h: quote.regularMarketDayLow,
          lastUpdated: new Date().toISOString(),
        };
      }
    }
    
    return prices;
  } catch (error) {
    console.error("Stock prices fetch error:", error);
    return {};
  }
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
