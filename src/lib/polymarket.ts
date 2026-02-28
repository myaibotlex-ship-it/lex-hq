const GAMMA_API = 'https://gamma-api.polymarket.com'
const CLOB_API = 'https://clob.polymarket.com'
const DATA_API = 'https://data-api.polymarket.com'

export interface PolymarketEvent {
  id: string
  title: string
  slug: string
  description?: string
  icon?: string
  image?: string
  volume: number
  volume24hr: number
  liquidity: number
  category?: string
  active: boolean
  closed: boolean
  markets?: PolymarketMarket[]
}

export interface PolymarketMarket {
  id: string
  question: string
  slug: string
  outcomes: string
  outcomePrices: string
  volume: number
  volume24hr?: number
  active: boolean
  closed: boolean
}

export interface PolymarketTrade {
  proxyWallet: string
  side: 'BUY' | 'SELL'
  size: number
  price: number
  timestamp: number
  title: string
  slug: string
  eventSlug: string
  outcome: string
  outcomeIndex: number
  name?: string
  pseudonym?: string
  transactionHash: string
}

export async function getHotEvents(limit = 20): Promise<PolymarketEvent[]> {
  const res = await fetch(
    `${GAMMA_API}/events?limit=${limit}&active=true&closed=false&order=volume24hr&ascending=false`
  )
  return res.json()
}

export async function getEvent(id: string): Promise<PolymarketEvent> {
  const res = await fetch(`${GAMMA_API}/events/${id}`)
  return res.json()
}

export async function searchEvents(query: string, limit = 20): Promise<PolymarketEvent[]> {
  const res = await fetch(
    `${GAMMA_API}/events?limit=${limit}&active=true&closed=false&title_contains=${encodeURIComponent(query)}`
  )
  return res.json()
}

export async function getRecentTrades(limit = 50): Promise<PolymarketTrade[]> {
  const res = await fetch(`${DATA_API}/trades?limit=${limit}`)
  return res.json()
}

export async function getUserPositions(address: string) {
  const res = await fetch(`${DATA_API}/positions?user=${address}`)
  return res.json()
}

export async function getUserValue(address: string) {
  const res = await fetch(`${DATA_API}/value?user=${address}`)
  return res.json()
}

// Parse outcome prices from string to array
export function parseOutcomePrices(pricesStr: string | null): number[] {
  if (!pricesStr) return [0, 0]
  try {
    return JSON.parse(pricesStr).map((p: string) => parseFloat(p))
  } catch {
    return [0, 0]
  }
}

// Parse outcomes from string to array
export function parseOutcomes(outcomesStr: string | null): string[] {
  if (!outcomesStr) return ['Yes', 'No']
  try {
    return JSON.parse(outcomesStr)
  } catch {
    return ['Yes', 'No']
  }
}

// Format large numbers
export function formatVolume(vol: number | null | undefined): string {
  if (!vol) return '$0'
  if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`
  if (vol >= 1000) return `$${(vol / 1000).toFixed(1)}K`
  return `$${vol.toFixed(0)}`
}

// Format probability as percentage
export function formatProb(prob: number): string {
  return `${(prob * 100).toFixed(1)}%`
}
