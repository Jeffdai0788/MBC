import axios from "axios";

// Polymarket API Base URLs
const GAMMA_API = "https://gamma-api.polymarket.com";
const CLOB_API = "https://clob.polymarket.com";
const DATA_API = "https://data-api.polymarket.com";

export interface Market {
    id: string;
    question: string;
    description: string;
    outcomes: string[];
    outcomePrices: string[];
    volume: string;
    liquidity: string;
    endDate: string;
    active: boolean;
    closed: boolean;
    conditionId: string;
}

export interface PricePoint {
    timestamp: number;
    price: number;
}

export interface Position {
    market: string;
    outcome: string;
    size: number;
    avgPrice: number;
    currentPrice: number;
    pnl: number;
}

export interface OrderParams {
    marketId: string;
    outcome: string;
    side: "BUY" | "SELL";
    size: number;
    price: number;
}

export interface OrderResult {
    success: boolean;
    orderId?: string;
    message: string;
    // For mock mode
    mock?: boolean;
}

export class PolymarketClient {
    private mockMode: boolean;

    constructor(mockMode: boolean = true) {
        this.mockMode = mockMode;
    }

    // ==================== MARKET DATA (Public) ====================

    async getMarkets(limit: number = 20): Promise<Market[]> {
        try {
            const res = await axios.get(`${GAMMA_API}/markets`, {
                params: { limit, active: true }
            });
            return res.data.map(this.normalizeMarket);
        } catch (e) {
            console.error("Error fetching markets:", e);
            return [];
        }
    }

    async getMarket(conditionId: string): Promise<Market | null> {
        try {
            const res = await axios.get(`${GAMMA_API}/markets/${conditionId}`);
            return this.normalizeMarket(res.data);
        } catch (e) {
            console.error("Error fetching market:", e);
            return null;
        }
    }

    async searchMarkets(query: string): Promise<Market[]> {
        try {
            const res = await axios.get(`${GAMMA_API}/markets`, {
                params: {
                    _q: query,
                    active: true,
                    limit: 20
                }
            });
            return res.data.map(this.normalizeMarket);
        } catch (e) {
            console.error("Error searching markets:", e);
            return [];
        }
    }

    async getPrices(conditionId: string): Promise<{ yes: number; no: number }> {
        try {
            const market = await this.getMarket(conditionId);
            if (market && market.outcomePrices.length >= 2) {
                return {
                    yes: parseFloat(market.outcomePrices[0]),
                    no: parseFloat(market.outcomePrices[1])
                };
            }
            return { yes: 0.5, no: 0.5 };
        } catch (e) {
            console.error("Error fetching prices:", e);
            return { yes: 0.5, no: 0.5 };
        }
    }

    async getHistoricalPrices(conditionId: string, days: number = 7): Promise<PricePoint[]> {
        try {
            const startTime = Date.now() - days * 24 * 60 * 60 * 1000;
            const res = await axios.get(`${DATA_API}/prices-history`, {
                params: {
                    market: conditionId,
                    startTs: Math.floor(startTime / 1000)
                }
            });
            return res.data.history?.map((p: any) => ({
                timestamp: p.t * 1000,
                price: p.p
            })) || [];
        } catch (e) {
            console.error("Error fetching historical prices:", e);
            return [];
        }
    }

    // ==================== POSITIONS (Requires Address) ====================

    async getPositions(address: string): Promise<Position[]> {
        try {
            const res = await axios.get(`${DATA_API}/positions`, {
                params: { user: address }
            });
            return res.data.map((p: any) => ({
                market: p.market,
                outcome: p.outcome,
                size: parseFloat(p.size),
                avgPrice: parseFloat(p.avgPrice || "0"),
                currentPrice: parseFloat(p.currentPrice || "0"),
                pnl: parseFloat(p.pnl || "0")
            }));
        } catch (e) {
            console.error("Error fetching positions:", e);
            return [];
        }
    }

    async getPortfolioValue(address: string): Promise<number> {
        try {
            const res = await axios.get(`${DATA_API}/value`, {
                params: { user: address }
            });
            return parseFloat(res.data.value || "0");
        } catch (e) {
            console.error("Error fetching portfolio value:", e);
            return 0;
        }
    }

    // ==================== TRADING (Mock for Hackathon Demo) ====================

    async placeBuyOrder(params: OrderParams): Promise<OrderResult> {
        if (this.mockMode) {
            return this.mockOrder(params, "BUY");
        }
        // Real trading would require Polygon wallet signing
        // Not implemented for hackathon demo
        return { success: false, message: "Real trading not implemented" };
    }

    async placeSellOrder(params: OrderParams): Promise<OrderResult> {
        if (this.mockMode) {
            return this.mockOrder(params, "SELL");
        }
        return { success: false, message: "Real trading not implemented" };
    }

    private mockOrder(params: OrderParams, side: string): OrderResult {
        const orderId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.log(`[MOCK] ${side} order: ${params.size} @ ${params.price} on ${params.outcome}`);
        return {
            success: true,
            orderId,
            message: `Mock ${side} order placed successfully`,
            mock: true
        };
    }

    // ==================== HELPERS ====================

    private normalizeMarket(raw: any): Market {
        return {
            id: raw.id || raw.conditionId,
            question: raw.question || raw.title || "",
            description: raw.description || "",
            outcomes: raw.outcomes || ["Yes", "No"],
            outcomePrices: raw.outcomePrices || raw.outcomes_prices || ["0.5", "0.5"],
            volume: raw.volume || raw.volumeNum || "0",
            liquidity: raw.liquidity || "0",
            endDate: raw.endDate || raw.end_date_iso || "",
            active: raw.active !== false,
            closed: raw.closed === true,
            conditionId: raw.conditionId || raw.id || ""
        };
    }
}

// Singleton for use in strategy execution
export const polymarketClient = new PolymarketClient(true);
