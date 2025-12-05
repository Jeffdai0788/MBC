import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { solanaClient, StrategyData } from "../../lib/solanaClient";

export default function DeveloperDashboard() {
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

    // Stats
    const totalStrategies = strategies.length;
    const listedCount = strategies.filter(s => s.listed).length;
    const totalRevenue = strategies.reduce((sum, s) => sum + s.listPrice, 0);

    if (!publicKey) {
        return (
            <div>
                <section className="hero">
                    <span className="text-label">Developer Dashboard</span>
                    <h1 className="page-title">Build & Monetize</h1>
                </section>
                <div className="card">
                    <p className="text-body">
                        Connect your wallet to create and manage strategies.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Hero */}
            <section className="hero">
                <div className="hero-header">
                    <div>
                        <span className="text-label">Developer Dashboard</span>
                        <h1 className="page-title">Build & Monetize</h1>
                        <p className="page-subtitle">
                            Create trading strategies, deploy to the marketplace, and earn from subscribers.
                        </p>
                    </div>
                    <Link href="/developer/create" className="btn btn-primary">
                        Create Strategy
                    </Link>
                </div>
            </section>

            {/* Stats */}
            <div className="stats-row">
                <div className="stat-item">
                    <div className="stat-value">{loading ? "—" : totalStrategies}</div>
                    <div className="stat-label">Strategies Created</div>
                </div>
                <div className="stat-item">
                    <div className="stat-value">{loading ? "—" : listedCount}</div>
                    <div className="stat-label">Listed</div>
                </div>
                <div className="stat-item">
                    <div className="stat-value">{loading ? "—" : `$${formatPrice(totalRevenue)}`}</div>
                    <div className="stat-label">Potential Revenue</div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="section">
                <h2 className="section-title">Quick Actions</h2>
                <div className="action-grid">
                    <Link href="/developer/create" className="action-card">
                        <div className="action-icon">+</div>
                        <div className="action-label">New Strategy</div>
                        <div className="action-desc">Write and deploy a trading bot</div>
                    </Link>
                    <Link href="/developer/strategies" className="action-card">
                        <div className="action-icon">⚡</div>
                        <div className="action-label">Manage</div>
                        <div className="action-desc">View and edit your strategies</div>
                    </Link>
                </div>
            </div>

            {/* Recent Strategies */}
            {!loading && strategies.length > 0 && (
                <div className="section">
                    <h2 className="section-title">Recent Strategies</h2>
                    <div className="grid-cards">
                        {strategies.slice(0, 3).map((strategy) => (
                            <Link href={`/strategy/${strategy.publicKey}`} key={strategy.publicKey}>
                                <article className="strategy-card">
                                    <span className={`badge ${strategy.listed ? "badge-success" : "badge-warning"}`}>
                                        {strategy.listed ? "Listed" : "Draft"}
                                    </span>
                                    <h3 className="strategy-card__name">
                                        {strategy.apiId || `Strategy ${strategy.strategyId}`}
                                    </h3>
                                    <div className="strategy-card__footer">
                                        <span className="strategy-card__price">
                                            {strategy.listed ? `${formatPrice(strategy.listPrice)} USDC` : "—"}
                                        </span>
                                    </div>
                                </article>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            <style jsx>{`
                .hero {
                    margin-bottom: var(--space-xl);
                }
                .hero-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: var(--space-lg);
                }
                .section {
                    margin-top: var(--space-xl);
                }
                .section-title {
                    font-family: var(--font-serif);
                    font-size: 1.25rem;
                    margin-bottom: var(--space-md);
                }
                .action-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: var(--space-md);
                    max-width: 500px;
                }
                .action-card {
                    display: block;
                    padding: var(--space-lg);
                    background: var(--color-paper);
                    border: 1px solid var(--color-paper-warm);
                    transition: all 0.2s ease;
                }
                .action-card:hover {
                    border-color: var(--color-ink);
                }
                .action-icon {
                    font-size: 1.5rem;
                    margin-bottom: var(--space-sm);
                }
                .action-label {
                    font-family: var(--font-serif);
                    font-size: 1.125rem;
                    margin-bottom: 0.25rem;
                }
                .action-desc {
                    font-size: 0.8125rem;
                    color: var(--color-ink-muted);
                }
            `}</style>
        </div>
    );
}
