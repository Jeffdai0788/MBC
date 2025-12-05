import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import { solanaClient, StrategyData } from "../../lib/solanaClient";

export default function MyStrategies() {
    const { publicKey } = useWallet();
    const [strategies, setStrategies] = useState<StrategyData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (publicKey) {
            fetchMyStrategies();
        } else {
            setStrategies([]);
            setLoading(false);
        }
    }, [publicKey]);

    const fetchMyStrategies = async () => {
        if (!publicKey) return;
        setLoading(true);
        try {
            const allStrategies = await solanaClient.getAllStrategies();
            const myStrategies = allStrategies.filter(
                s => s.creator === publicKey.toBase58()
            );
            setStrategies(myStrategies);
        } catch (e) {
            console.error("Error fetching strategies:", e);
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price: number) => (price / 1_000_000).toFixed(0);
    const shortenAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

    if (!publicKey) {
        return (
            <div>
                <header className="page-header">
                    <span className="text-label">Your Strategies</span>
                    <h1 className="page-title">Portfolio</h1>
                </header>
                <div className="card">
                    <p className="text-body">
                        Connect your wallet to view your strategies.
                    </p>
                </div>
            </div>
        );
    }

    const totalValue = strategies.reduce((sum, s) => sum + s.listPrice, 0);
    const listedCount = strategies.filter(s => s.listed).length;

    return (
        <div>
            <header className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                    <span className="text-label">Your Strategies</span>
                    <h1 className="page-title">Portfolio</h1>
                </div>
                <Link href="/developer/create" className="btn btn-secondary">
                    New Strategy
                </Link>
            </header>

            {/* Stats */}
            <div className="stats-row">
                <div className="stat-item">
                    <div className="stat-value">{loading ? "—" : strategies.length}</div>
                    <div className="stat-label">Created</div>
                </div>
                <div className="stat-item">
                    <div className="stat-value">{loading ? "—" : listedCount}</div>
                    <div className="stat-label">Listed</div>
                </div>
                <div className="stat-item">
                    <div className="stat-value">{loading ? "—" : `$${formatPrice(totalValue)}`}</div>
                    <div className="stat-label">Total Value</div>
                </div>
            </div>

            {/* Loading */}
            {loading && <p className="text-body">Loading...</p>}

            {/* Empty State */}
            {!loading && strategies.length === 0 && (
                <div style={{ marginTop: "var(--space-xl)", maxWidth: "400px" }}>
                    <h2 style={{ marginBottom: "var(--space-sm)" }}>No strategies yet</h2>
                    <p className="text-body" style={{ marginBottom: "var(--space-lg)" }}>
                        Create your first trading strategy and start earning.
                    </p>
                    <Link href="/developer/create" className="btn btn-primary">
                        Create Strategy
                    </Link>
                </div>
            )}

            {/* Table */}
            {!loading && strategies.length > 0 && (
                <table className="table">
                    <thead>
                        <tr>
                            <th>Strategy</th>
                            <th>Status</th>
                            <th>Price</th>
                            <th>Last Update</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {strategies.map((strategy) => (
                            <tr key={strategy.publicKey}>
                                <td>
                                    <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.125rem" }}>
                                        {strategy.apiId || `Strategy ${strategy.strategyId}`}
                                    </div>
                                    <div className="text-mono" style={{ color: "var(--color-stone)", marginTop: "4px" }}>
                                        {shortenAddress(strategy.publicKey)}
                                    </div>
                                </td>
                                <td>
                                    <span className={`badge ${strategy.listed ? "badge-success" : "badge-warning"}`}>
                                        {strategy.listed ? "Listed" : "Unlisted"}
                                    </span>
                                </td>
                                <td>
                                    {strategy.listed ? `${formatPrice(strategy.listPrice)} USDC` : "—"}
                                </td>
                                <td className="text-mono" style={{ color: "var(--color-ink-muted)" }}>
                                    {strategy.lastUpdateTs > 0
                                        ? new Date(strategy.lastUpdateTs * 1000).toLocaleDateString()
                                        : "Never"}
                                </td>
                                <td style={{ textAlign: "right" }}>
                                    <Link href={`/strategy/${strategy.publicKey}`} className="btn btn-secondary" style={{ padding: "0.5rem 1rem" }}>
                                        View
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
