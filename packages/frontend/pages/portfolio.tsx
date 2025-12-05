import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { solanaClient, StrategyData } from "../lib/solanaClient";

export default function TraderPortfolio() {
    const { publicKey } = useWallet();
    const [strategies, setStrategies] = useState<StrategyData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (publicKey) {
            fetchOwnedStrategies();
        } else {
            setStrategies([]);
            setLoading(false);
        }
    }, [publicKey]);

    const fetchOwnedStrategies = async () => {
        if (!publicKey) return;
        setLoading(true);
        try {
            // Fetch portfolio (both created and bought strategies)
            const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000"}/api/user/portfolio/${publicKey.toBase58()}`);
            if (res.ok) {
                const portfolio = await res.json();

                // Map to frontend format
                const mapped = portfolio.map((s: any) => ({
                    id: s.strategyId,
                    name: s.apiId || `Strategy ${s.strategyId.slice(0, 8)}`,
                    description: s.description || "Trading strategy",
                    category: s.category || "Crypto",
                    strategyType: "Event-Driven",
                    returns: { "1D": 0, "5D": 0, "1W": 0, "1M": 0, "1Y": 0, "Max": 0 },
                    priceHistory: { "1D": [], "5D": [], "1W": [], "1M": [], "1Y": [], "Max": [] },
                    riskLevel: "Medium",
                    sharpeRatio: 0,
                    sortinoRatio: 0,
                    maxDrawdown: 0,
                    volatility: 0,
                    winRate: 0,
                    avgWin: 0,
                    avgLoss: 0,
                    bullMarketPerf: 0,
                    bearMarketPerf: 0,
                    creator: s.creator || s.seller || "Unknown",
                    subscribers: 0,
                    listPrice: s.listPrice / 1_000_000,
                    createdAt: new Date(s.lastUpdateTs * 1000).toISOString().split('T')[0],
                    status: s.status || "active"
                }));

                setStrategies(mapped);
            }
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
                <section className="hero">
                    <span className="text-label">Trader Dashboard</span>
                    <h1 className="page-title">My Strategies</h1>
                </section>
                <div className="card">
                    <p className="text-body">
                        Connect your wallet to view strategies you own.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <section className="hero">
                <span className="text-label">Trader Dashboard</span>
                <h1 className="page-title">My Strategies</h1>
                <p className="page-subtitle">
                    Strategies you've purchased. Hold the NFT to access live signals.
                </p>
            </section>

            {/* Loading */}
            {loading && <p className="text-body">Loading...</p>}

            {/* Empty State */}
            {!loading && strategies.length === 0 && (
                <div className="empty-state">
                    <h2>No strategies yet</h2>
                    <p className="text-body" style={{ marginBottom: "var(--space-lg)" }}>
                        Purchase strategy NFTs to access live trading signals.
                    </p>
                    <Link href="/" className="btn btn-primary">
                        Browse Strategies
                    </Link>
                </div>
            )}

            {/* Strategy List */}
            {!loading && strategies.length > 0 && (
                <div className="grid-cards">
                    {strategies.map((strategy) => (
                        <Link href={`/strategy/${strategy.publicKey}`} key={strategy.publicKey}>
                            <article className="strategy-card">
                                <span className="badge badge-success" style={{ marginBottom: "var(--space-sm)" }}>
                                    Owned
                                </span>
                                <h3 className="strategy-card__name">
                                    {strategy.apiId || `Strategy ${strategy.strategyId}`}
                                </h3>
                                <div className="strategy-card__meta">
                                    <span>Last signal: —</span>
                                </div>
                                <div className="strategy-card__footer">
                                    <span className="strategy-card__creator">
                                        by {shortenAddress(strategy.creator)}
                                    </span>
                                </div>
                            </article>
                        </Link>
                    ))}
                </div>
            )}

            <style jsx>{`
                .hero {
                    margin-bottom: var(--space-xl);
                    max-width: 560px;
                }
                .empty-state {
                    margin-top: var(--space-xl);
                    max-width: 400px;
                }
                .empty-state h2 {
                    margin-bottom: var(--space-sm);
                }
            `}</style>
        </div>
    );
}
