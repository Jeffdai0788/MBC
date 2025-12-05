import React, { useState } from "react";

// Mock Data Types
interface DeveloperRank {
    rank: number;
    address: string;
    strategiesCreated: number;
    totalVolume: number;
    avgReturn: number;
    followers: number;
}

interface TraderRank {
    rank: number;
    address: string;
    strategiesHeld: number;
    totalProfit: number;
    winRate: number;
    bestTrade: number;
}

// Mock Data Generation
const mockDevelopers: DeveloperRank[] = [
    { rank: 1, address: "A1oc...Xrpu", strategiesCreated: 12, totalVolume: 1250000, avgReturn: 42.5, followers: 3420 },
    { rank: 2, address: "B2kf...Yrtp", strategiesCreated: 8, totalVolume: 890000, avgReturn: 38.2, followers: 2150 },
    { rank: 3, address: "C3lm...Zqwx", strategiesCreated: 15, totalVolume: 750000, avgReturn: 28.5, followers: 1890 },
    { rank: 4, address: "D4mn...Apvr", strategiesCreated: 5, totalVolume: 620000, avgReturn: 55.1, followers: 1240 },
    { rank: 5, address: "E5op...Bqst", strategiesCreated: 22, totalVolume: 580000, avgReturn: 18.2, followers: 980 },
];

const mockTraders: TraderRank[] = [
    { rank: 1, address: "F6pq...Cruw", strategiesHeld: 5, totalProfit: 45000, winRate: 0.78, bestTrade: 12500 },
    { rank: 2, address: "G7rs...Dsvx", strategiesHeld: 3, totalProfit: 32000, winRate: 0.65, bestTrade: 8900 },
    { rank: 3, address: "H8st...Etwy", strategiesHeld: 8, totalProfit: 28500, winRate: 0.52, bestTrade: 15000 },
    { rank: 4, address: "I9tu...Fuxz", strategiesHeld: 4, totalProfit: 21000, winRate: 0.71, bestTrade: 6200 },
    { rank: 5, address: "J0uv...Gvya", strategiesHeld: 6, totalProfit: 18500, winRate: 0.62, bestTrade: 4500 },
];

export default function Leaderboard() {
    const [activeTab, setActiveTab] = useState<"developers" | "traders">("developers");

    const formatAddress = (addr: string) => addr; // Already formatted in mock data
    const formatCurrency = (val: number) => `$${val.toLocaleString()}`;
    const formatPercent = (val: number) => `${val.toFixed(1)}%`;

    return (
        <div className="leaderboard-container">
            <div className="leaderboard-header">
                <h2 className="leaderboard-title">Community Leaderboard</h2>
                <div className="leaderboard-tabs">
                    <button
                        className={`tab-btn ${activeTab === "developers" ? "active" : ""}`}
                        onClick={() => setActiveTab("developers")}
                    >
                        Top Developers
                    </button>
                    <button
                        className={`tab-btn ${activeTab === "traders" ? "active" : ""}`}
                        onClick={() => setActiveTab("traders")}
                    >
                        Top Traders
                    </button>
                </div>
            </div>

            <div className="leaderboard-content">
                <table className="leaderboard-table">
                    <thead>
                        {activeTab === "developers" ? (
                            <tr>
                                <th className="rank-col">Rank</th>
                                <th>Developer</th>
                                <th className="num-col">Strategies</th>
                                <th className="num-col">Total Volume</th>
                                <th className="num-col">Avg Return</th>
                                <th className="num-col">Followers</th>
                            </tr>
                        ) : (
                            <tr>
                                <th className="rank-col">Rank</th>
                                <th>Trader</th>
                                <th className="num-col">Active Strategies</th>
                                <th className="num-col">Total Profit</th>
                                <th className="num-col">Win Rate</th>
                                <th className="num-col">Best Trade</th>
                            </tr>
                        )}
                    </thead>
                    <tbody>
                        {activeTab === "developers" ? (
                            mockDevelopers.map((dev) => (
                                <tr key={dev.rank}>
                                    <td className="rank-col">
                                        <span className={`rank-badge rank-${dev.rank}`}>{dev.rank}</span>
                                    </td>
                                    <td className="address-col">{dev.address}</td>
                                    <td className="num-col">{dev.strategiesCreated}</td>
                                    <td className="num-col">{formatCurrency(dev.totalVolume)}</td>
                                    <td className="num-col highlight">{formatPercent(dev.avgReturn)}</td>
                                    <td className="num-col">{dev.followers.toLocaleString()}</td>
                                </tr>
                            ))
                        ) : (
                            mockTraders.map((trader) => (
                                <tr key={trader.rank}>
                                    <td className="rank-col">
                                        <span className={`rank-badge rank-${trader.rank}`}>{trader.rank}</span>
                                    </td>
                                    <td className="address-col">{trader.address}</td>
                                    <td className="num-col">{trader.strategiesHeld}</td>
                                    <td className="num-col highlight">{formatCurrency(trader.totalProfit)}</td>
                                    <td className="num-col">{formatPercent(trader.winRate * 100)}</td>
                                    <td className="num-col">{formatCurrency(trader.bestTrade)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <style jsx>{`
                .leaderboard-container {
                    background: var(--color-paper);
                    border: 1px solid var(--color-paper-warm);
                    border-radius: 12px;
                    padding: var(--space-lg);
                    margin-top: var(--space-2xl);
                }
                .leaderboard-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: var(--space-lg);
                }
                .leaderboard-title {
                    font-family: var(--font-serif);
                    font-size: 1.25rem;
                    margin: 0;
                    color: var(--color-ink);
                }
                .leaderboard-tabs {
                    display: flex;
                    background: var(--color-paper-warm);
                    padding: 4px;
                    border-radius: 8px;
                }
                .tab-btn {
                    padding: 0.5rem 1rem;
                    border: none;
                    background: transparent;
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: var(--color-stone);
                    cursor: pointer;
                    border-radius: 6px;
                    transition: all 0.2s ease;
                }
                .tab-btn.active {
                    background: var(--color-paper);
                    color: var(--color-ink);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                }
                .leaderboard-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .leaderboard-table th {
                    text-align: left;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: var(--color-stone);
                    padding: 1rem;
                    border-bottom: 1px solid var(--color-paper-warm);
                }
                .leaderboard-table td {
                    padding: 1rem;
                    font-size: 0.9375rem;
                    color: var(--color-ink);
                    border-bottom: 1px solid var(--color-paper-warm);
                }
                .leaderboard-table tr:last-child td {
                    border-bottom: none;
                }
                .rank-col {
                    width: 60px;
                    text-align: center;
                }
                .num-col {
                    text-align: right;
                    font-family: var(--font-mono);
                }
                .leaderboard-table th.num-col {
                    text-align: right;
                }
                .address-col {
                    font-family: var(--font-mono);
                    color: var(--color-ink-muted);
                }
                .highlight {
                    color: var(--color-success);
                    font-weight: 600;
                }
                .rank-badge {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    font-size: 0.75rem;
                    font-weight: 600;
                    background: var(--color-paper-warm);
                    color: var(--color-ink-muted);
                }
                .rank-1 { background: #FFD700; color: #92400E; }
                .rank-2 { background: #C0C0C0; color: #374151; }
                .rank-3 { background: #CD7F32; color: #92400E; }
            `}</style>
        </div>
    );
}
