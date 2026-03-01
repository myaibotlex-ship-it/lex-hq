import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";

const execAsync = promisify(exec);

const STATE_FILE = "/Users/danrackley/clawd/memory/latency-monitor-state.json";
const BINANCE_API = "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT";

interface GapDetected {
  timestamp: string;
  binance_price: number;
  kalshi_implied: number;
  gap_usd: number;
  direction: string;
  stale_seconds: number;
}

interface Prediction {
  timestamp: string;
  market_ticker: string;
  predicted_prob: number;
  notes: string;
  resolved: boolean;
  outcome: number | null;
  resolved_at?: string;
}

interface MonitorState {
  predictions: Prediction[];
  gaps_detected: GapDetected[];
  last_update: string;
}

export async function GET() {
  try {
    // Get current Binance price
    const binanceRes = await fetch(BINANCE_API);
    const binanceData = await binanceRes.json();
    const binancePrice = parseFloat(binanceData.price);

    // Get Kalshi BTC markets via Python script
    let kalshiData = null;
    try {
      const { stdout } = await execAsync(
        `cd /Users/danrackley/clawd && python3 -c "
import sys
sys.path.insert(0, 'scripts')
from kalshi_client import KalshiClient
import json

client = KalshiClient()
result = client.get('/trade-api/v2/events?series_ticker=KXBTCD&status=open&limit=3')
events = result.get('events', [])

if events:
    event_ticker = events[0]['event_ticker']
    markets = client.get(f'/trade-api/v2/markets?event_ticker={event_ticker}&limit=50')
    
    # Find markets near 50% probability
    best_markets = []
    for m in markets.get('markets', []):
        yes_bid = m.get('yes_bid', 0)
        yes_ask = m.get('yes_ask', 100)
        mid = (yes_bid + yes_ask) / 2
        subtitle = m.get('yes_sub_title', '')
        volume = m.get('volume', 0) / 100
        
        try:
            price_str = subtitle.replace('\$', '').replace(',', '').split()[0]
            strike = float(price_str)
            best_markets.append({
                'strike': strike,
                'mid_prob': mid,
                'yes_bid': yes_bid,
                'yes_ask': yes_ask,
                'volume': volume,
                'subtitle': subtitle
            })
        except:
            pass
    
    # Sort by proximity to 50%
    best_markets.sort(key=lambda x: abs(x['mid_prob'] - 50))
    print(json.dumps({'event': event_ticker, 'markets': best_markets[:10]}))
else:
    print(json.dumps({'event': None, 'markets': []}))
"`,
        { timeout: 10000 }
      );
      kalshiData = JSON.parse(stdout.trim());
    } catch (e) {
      console.error("Kalshi fetch error:", e);
    }

    // Calculate implied Kalshi price (strike where prob ~= 50%)
    let kalshiImplied = null;
    if (kalshiData?.markets?.length > 0) {
      const nearestMarket = kalshiData.markets[0];
      kalshiImplied = nearestMarket.strike;
    }

    // Load state file for historical data
    let state: MonitorState = {
      predictions: [],
      gaps_detected: [],
      last_update: new Date().toISOString(),
    };

    if (fs.existsSync(STATE_FILE)) {
      try {
        state = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
      } catch (e) {
        console.error("State file parse error:", e);
      }
    }

    // Calculate Brier score
    const resolved = state.predictions.filter((p) => p.resolved);
    let brierScore = null;
    if (resolved.length > 0) {
      const scores = resolved.map(
        (p) => Math.pow(p.predicted_prob - (p.outcome || 0), 2)
      );
      brierScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    }

    // Calculate current gap
    const currentGap = kalshiImplied
      ? Math.abs(binancePrice - kalshiImplied)
      : null;

    return NextResponse.json({
      binance: {
        price: binancePrice,
        timestamp: new Date().toISOString(),
      },
      kalshi: {
        implied_price: kalshiImplied,
        event: kalshiData?.event,
        markets: kalshiData?.markets || [],
      },
      gap: {
        current_usd: currentGap,
        direction:
          currentGap && kalshiImplied
            ? binancePrice > kalshiImplied
              ? "UP"
              : "DOWN"
            : null,
        is_opportunity: currentGap ? currentGap > 150 : false,
      },
      history: {
        gaps_24h: state.gaps_detected.filter((g) => {
          const gapTime = new Date(g.timestamp).getTime();
          const now = Date.now();
          return now - gapTime < 24 * 60 * 60 * 1000;
        }),
        total_predictions: state.predictions.length,
        resolved_predictions: resolved.length,
        brier_score: brierScore,
      },
    });
  } catch (error) {
    console.error("Arbitrage API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, market_ticker, predicted_prob, outcome, notes } = body;

    // Load current state
    let state: MonitorState = {
      predictions: [],
      gaps_detected: [],
      last_update: new Date().toISOString(),
    };

    if (fs.existsSync(STATE_FILE)) {
      try {
        state = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
      } catch (e) {
        console.error("State file parse error:", e);
      }
    }

    if (action === "log_prediction") {
      // Add new prediction
      state.predictions.push({
        timestamp: new Date().toISOString(),
        market_ticker,
        predicted_prob,
        notes: notes || "",
        resolved: false,
        outcome: null,
      });
    } else if (action === "resolve_prediction") {
      // Resolve existing prediction
      for (let i = state.predictions.length - 1; i >= 0; i--) {
        if (
          state.predictions[i].market_ticker === market_ticker &&
          !state.predictions[i].resolved
        ) {
          state.predictions[i].resolved = true;
          state.predictions[i].outcome = outcome;
          state.predictions[i].resolved_at = new Date().toISOString();
          break;
        }
      }
    }

    // Save state
    state.last_update = new Date().toISOString();
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));

    return NextResponse.json({ success: true, state });
  } catch (error) {
    console.error("Arbitrage POST error:", error);
    return NextResponse.json({ error: "Failed to process" }, { status: 500 });
  }
}
