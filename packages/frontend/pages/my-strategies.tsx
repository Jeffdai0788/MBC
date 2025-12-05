import React, { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";

// Mock data for user's strategies
const mockMyStrategies = [
    {
        id: "1",
        name: "BTC Momentum Alpha",
        status: "active",
        listed: true,
        price: 50,
        subscribers: 28,
        revenue: 1400,
        signals: 142,
        lastSignal: "BUY_YES",
        lastUpdate: new Date().toISOString(),
    },
];

export default function MyStrategies() {
    const { publicKey } = useWallet();
    const [strategies] = useState(mockMyStrategies);

    if (!publicKey) {
        return (
            <div>
                <div className="page-header">
                    <h1 className="page-title">My Strategies</h1>
                </div>
                <div className="card">
                    <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "2rem" }}>
                        Please connect your wallet to view your strategies
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h1 className="page-title">My Strategies</h1>
                    <p className="page-subtitle">Manage and monitor your trading strategies</p>
                </div>
                <Link href="/create" className="btn btn-primary">
                    + Create New
                </Link>
            </div>

            {/* Revenue Stats */}
            <div className="stat-grid" style={{ marginBottom: "2rem" }}>
                <div className="stat-card">
                    <div className="stat-value">{strategies.length}</div>
                    <div className="stat-label">Total Strategies</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{strategies.reduce((a, s) => a + s.subscribers, 0)}</div>
                    <div className="stat-label">Total Subscribers</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">${strategies.reduce((a, s) => a + s.revenue, 0)}</div>
                    <div className="stat-label">Total Revenue</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{strategies.reduce((a, s) => a + s.signals, 0)}</div>
                    <div className="stat-label">Signals Sent</div>
                </div>
            </div>

            {/* Strategies Table */}
            <div className="card">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Strategy</th>
                            <th>Status</th>
                            <th>Price</th>
                            <th>Subscribers</th>
                            <th>Last Signal</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {strategies.map((strategy) => (
                            <tr key={strategy.id}>
                                <td>
                                    <div style={{ fontWeight: 600 }}>{strategy.name}</div>
                                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                        ID: {strategy.id}
                                    </div>
                                </td>
                                <td>
                                    <span className={`badge ${strategy.status === "active" ? "badge-success" : "badge-warning"}`}>
                                        {strategy.status}
                                    </span>
                                </td>
                                <td>{strategy.price} USDC</td>
                                <td>{strategy.subscribers}</td>
                                <td>
                                    <span className={`badge ${strategy.lastSignal === "BUY_YES" ? "badge-success" :
                                            strategy.lastSignal === "SELL_YES" ? "badge-error" : "badge-warning"
                                        }`}>
                                        {strategy.lastSignal}
                                    </span>
                                </td>
                                <td>
                                    <Link href={`/strategy/${strategy.id}`} className="btn btn-secondary" style={{ padding: "0.5rem 1rem", fontSize: "0.75rem" }}>
                                        View Details
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {strategies.length === 0 && (
                    <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>
                        <p>You haven't created any strategies yet.</p>
                        <Link href="/create" className="btn btn-primary" style={{ marginTop: "1rem" }}>
                            Create Your First Strategy
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
