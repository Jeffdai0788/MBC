// Strategy performance data types and mock generator
// Uses real Polymarket categories but generates strategy-specific metrics

export interface StrategyMetrics {
    id: string;
    name: string;
    description: string;
    category: "Politics" | "Crypto" | "Sports" | "Finance" | "AI" | "Weather";
    strategyType: "Momentum" | "Mean Reversion" | "Arbitrage" | "Event-Driven" | "Statistical";

    // Performance
    returns: {
        "1D": number;
        "5D": number;
        "1W": number;
        "1M": number;
        "1Y": number;
        "Max": number;
    };
    priceHistory: {
        "1D": number[];
        "5D": number[];
        "1W": number[];
        "1M": number[];
        "1Y": number[];
        "Max": number[];
    };

    // Risk metrics
    riskLevel: "Low" | "Medium" | "High";
    sharpeRatio: number;
    sortinoRatio: number;
    maxDrawdown: number;
    volatility: number;

    // Win/Loss
    winRate: number;
    avgWin: number;
    avgLoss: number;

    // Market behavior
    bullMarketPerf: number;
    bearMarketPerf: number;

    // Meta
    creator: string;
    subscribers: number;
    listPrice: number;
    createdAt: string;
    status: "active" | "paused" | "listed" | "unlisted";
}

// Generate realistic price history
function generatePriceHistory(baseReturn: number, volatility: number, points: number): number[] {
    const history: number[] = [100];
    const dailyReturn = baseReturn / 365;
    const dailyVol = volatility / Math.sqrt(365);

    for (let i = 1; i < points; i++) {
        const randomReturn = (Math.random() - 0.5) * 2 * dailyVol + dailyReturn;
        history.push(history[i - 1] * (1 + randomReturn));
    }
    return history;
}

// Mock strategies with realistic data
export const mockStrategies: StrategyMetrics[] = [
    {
        id: "strat-1",
        name: "Election Alpha",
        description: "Momentum-based strategy exploiting political event volatility and sentiment shifts around major elections.",
        category: "Politics",
        strategyType: "Momentum",
        returns: { "1D": 2.4, "5D": 5.8, "1W": 8.2, "1M": 18.5, "1Y": 142.3, "Max": 312.5 },
        priceHistory: {
            "1D": generatePriceHistory(0.024, 0.15, 24),
            "5D": generatePriceHistory(0.058, 0.18, 120),
            "1W": generatePriceHistory(0.082, 0.20, 168),
            "1M": generatePriceHistory(0.185, 0.22, 720),
            "1Y": generatePriceHistory(1.423, 0.25, 365),
            "Max": generatePriceHistory(3.125, 0.28, 730),
        },
        riskLevel: "High",
        sharpeRatio: 2.34,
        sortinoRatio: 3.12,
        maxDrawdown: -18.5,
        volatility: 42.3,
        winRate: 0.62,
        avgWin: 8.5,
        avgLoss: -4.2,
        bullMarketPerf: 28.5,
        bearMarketPerf: -8.2,
        creator: "A1oc...Xrpu",
        subscribers: 342,
        listPrice: 150,
        createdAt: "2024-01-15",
        status: "active",
    },
    {
        id: "strat-2",
        name: "Crypto Volatility Harvester",
        description: "Mean-reversion strategy capturing crypto market overreactions and mispricings.",
        category: "Crypto",
        strategyType: "Mean Reversion",
        returns: { "1D": -0.8, "5D": 3.2, "1W": 5.1, "1M": 12.8, "1Y": 89.4, "Max": 156.2 },
        priceHistory: {
            "1D": generatePriceHistory(-0.008, 0.20, 24),
            "5D": generatePriceHistory(0.032, 0.22, 120),
            "1W": generatePriceHistory(0.051, 0.25, 168),
            "1M": generatePriceHistory(0.128, 0.28, 720),
            "1Y": generatePriceHistory(0.894, 0.32, 365),
            "Max": generatePriceHistory(1.562, 0.35, 730),
        },
        riskLevel: "High",
        sharpeRatio: 1.89,
        sortinoRatio: 2.45,
        maxDrawdown: -32.1,
        volatility: 58.7,
        winRate: 0.58,
        avgWin: 12.3,
        avgLoss: -7.8,
        bullMarketPerf: 45.2,
        bearMarketPerf: -15.8,
        creator: "B2kf...Yrtp",
        subscribers: 567,
        listPrice: 200,
        createdAt: "2024-03-22",
        status: "paused",
    },
    {
        id: "strat-3",
        name: "Sports Arbitrage Pro",
        description: "Statistical arbitrage exploiting odds discrepancies across major sporting events.",
        category: "Sports",
        strategyType: "Arbitrage",
        returns: { "1D": 0.3, "5D": 1.5, "1W": 2.1, "1M": 4.8, "1Y": 24.5, "Max": 42.8 },
        priceHistory: {
            "1D": generatePriceHistory(0.003, 0.05, 24),
            "5D": generatePriceHistory(0.015, 0.06, 120),
            "1W": generatePriceHistory(0.021, 0.07, 168),
            "1M": generatePriceHistory(0.048, 0.08, 720),
            "1Y": generatePriceHistory(0.245, 0.10, 365),
            "Max": generatePriceHistory(0.428, 0.12, 730),
        },
        riskLevel: "Low",
        sharpeRatio: 3.45,
        sortinoRatio: 4.21,
        maxDrawdown: -5.2,
        volatility: 12.4,
        winRate: 0.78,
        avgWin: 2.1,
        avgLoss: -1.2,
        bullMarketPerf: 12.5,
        bearMarketPerf: 8.2,
        creator: "C3lm...Zqwx",
        subscribers: 892,
        listPrice: 75,
        createdAt: "2023-11-08",
        status: "active",
    },
    {
        id: "strat-4",
        name: "AI Hype Tracker",
        description: "Event-driven strategy capitalizing on AI announcements and tech sentiment.",
        category: "AI",
        strategyType: "Event-Driven",
        returns: { "1D": 4.2, "5D": 12.5, "1W": 15.8, "1M": 38.2, "1Y": 185.6, "Max": 285.3 },
        priceHistory: {
            "1D": generatePriceHistory(0.042, 0.25, 24),
            "5D": generatePriceHistory(0.125, 0.28, 120),
            "1W": generatePriceHistory(0.158, 0.30, 168),
            "1M": generatePriceHistory(0.382, 0.35, 720),
            "1Y": generatePriceHistory(1.856, 0.40, 365),
            "Max": generatePriceHistory(2.853, 0.45, 730),
        },
        riskLevel: "High",
        sharpeRatio: 2.78,
        sortinoRatio: 3.56,
        maxDrawdown: -28.4,
        volatility: 65.2,
        winRate: 0.55,
        avgWin: 18.5,
        avgLoss: -12.3,
        bullMarketPerf: 52.3,
        bearMarketPerf: -22.5,
        creator: "D4mn...Apvr",
        subscribers: 1245,
        listPrice: 250,
        createdAt: "2024-06-01",
        status: "listed",
    },
    {
        id: "strat-5",
        name: "Steady Yield",
        description: "Low-risk statistical approach targeting consistent small gains across all market conditions.",
        category: "Finance",
        strategyType: "Statistical",
        returns: { "1D": 0.12, "5D": 0.58, "1W": 0.85, "1M": 2.1, "1Y": 15.8, "Max": 28.4 },
        priceHistory: {
            "1D": generatePriceHistory(0.0012, 0.03, 24),
            "5D": generatePriceHistory(0.0058, 0.04, 120),
            "1W": generatePriceHistory(0.0085, 0.05, 168),
            "1M": generatePriceHistory(0.021, 0.06, 720),
            "1Y": generatePriceHistory(0.158, 0.08, 365),
            "Max": generatePriceHistory(0.284, 0.10, 730),
        },
        riskLevel: "Low",
        sharpeRatio: 4.12,
        sortinoRatio: 5.02,
        maxDrawdown: -3.8,
        volatility: 8.5,
        winRate: 0.82,
        avgWin: 1.2,
        avgLoss: -0.8,
        bullMarketPerf: 8.5,
        bearMarketPerf: 6.2,
        creator: "E5op...Bqst",
        subscribers: 2156,
        listPrice: 50,
        createdAt: "2023-08-15",
        status: "unlisted",
    },
    {
        id: "strat-6",
        name: "Weather Derivatives Alpha",
        description: "Exploits weather prediction market inefficiencies using meteorological data.",
        category: "Weather",
        strategyType: "Event-Driven",
        returns: { "1D": 1.5, "5D": 4.2, "1W": 6.8, "1M": 14.2, "1Y": 68.5, "Max": 112.3 },
        priceHistory: {
            "1D": generatePriceHistory(0.015, 0.12, 24),
            "5D": generatePriceHistory(0.042, 0.14, 120),
            "1W": generatePriceHistory(0.068, 0.16, 168),
            "1M": generatePriceHistory(0.142, 0.18, 720),
            "1Y": generatePriceHistory(0.685, 0.22, 365),
            "Max": generatePriceHistory(1.123, 0.25, 730),
        },
        riskLevel: "Medium",
        sharpeRatio: 2.15,
        sortinoRatio: 2.89,
        maxDrawdown: -15.2,
        volatility: 28.5,
        winRate: 0.65,
        avgWin: 6.8,
        avgLoss: -4.5,
        bullMarketPerf: 22.5,
        bearMarketPerf: 5.8,
        creator: "F6pq...Cruw",
        subscribers: 423,
        listPrice: 100,
        createdAt: "2024-02-28",
        status: "active",
    },
];

// Category colors
export const categoryColors: Record<string, string> = {
    Politics: "#6366f1",
    Crypto: "#f59e0b",
    Sports: "#10b981",
    Finance: "#3b82f6",
    AI: "#8b5cf6",
    Weather: "#06b6d4",
};

// Strategy type descriptions
export const strategyTypeDescriptions: Record<string, string> = {
    Momentum: "Follows market trends and sentiment",
    "Mean Reversion": "Bets on prices returning to average",
    Arbitrage: "Exploits price discrepancies",
    "Event-Driven": "Capitalizes on specific events",
    Statistical: "Uses quantitative models",
};
