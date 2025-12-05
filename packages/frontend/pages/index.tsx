import React, { useEffect, useState } from "react";
import Link from "next/link";

// Mock data for strategies (in production, fetch from chain)
const mockStrategies = [
    {
        id: "1",
        name: "BTC Momentum Alpha",
        description: "High-frequency momentum strategy for BTC/USDC",
        price: 50,
        creator: "7xKX...9mPq",
        performance: "+24.5%",
        signals: 142,
        subscribers: 28,
    },
    {
        id: "2",
        name: "ETH Mean Reversion",
        description: "Mean reversion strategy optimized for ETH volatility",
        price: 35,
        creator: "3nYt...kL2m",
        performance: "+18.2%",
        signals: 89,
        subscribers: 15,
    },
    {
        id: "3",
        name: "SOL Breakout Hunter",
        description: "Identifies breakout patterns in SOL price action",
        price: 25,
        creator: "9pQr...xN4j",
        performance: "+31.8%",
        signals: 56,
        subscribers: 42,
    },
];

export default function Marketplace() {
    const [strategies, setStrategies] = useState(mockStrategies);
    const [searchTerm, setSearchTerm] = useState("");

    const filteredStrategies = strategies.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Strategy Marketplace</h1>
                <p className="page-subtitle">
                    Discover and subscribe to profitable trading strategies
                </p>
            </div>

            {/* Stats Overview */}
            <div className="stat-grid" style={{ marginBottom: "2rem" }}>
                <div className="stat-card">
                    <div className="stat-value">24</div>
                    <div className="stat-label">Active Strategies</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">1,247</div>
                    <div className="stat-label">Total Subscribers</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">$45.2K</div>
                    <div className="stat-label">Total Volume</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">+22.4%</div>
                    <div className="stat-label">Avg. Performance</div>
                </div>
            </div>

            {/* Search */}
            <div style={{ marginBottom: "1.5rem" }}>
                <input
                    type="text"
                    className="form-input"
                    placeholder="Search strategies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ maxWidth: "400px" }}
                />
            </div>

            {/* Strategy Grid */}
            <div className="grid-3">
                {filteredStrategies.map((strategy) => (
                    <Link href={`/strategy/${strategy.id}`} key={strategy.id}>
                        <div className="strategy-card">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <h3 className="strategy-name">{strategy.name}</h3>
                                <span className="badge badge-success">{strategy.performance}</span>
                            </div>
                            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "1rem" }}>
                                {strategy.description}
                            </p>
                            <div className="strategy-meta">
                                <span>📊 {strategy.signals} signals</span>
                                <span>👥 {strategy.subscribers} subs</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span className="strategy-price">{strategy.price} USDC</span>
                                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                    by {strategy.creator}
                                </span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
