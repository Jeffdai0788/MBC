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
            // For now, fetch all strategies
            // TODO: Filter by NFT ownership once we have that check
            const allStrategies = await solanaClient.getAllStrategies();
            // Show strategies where user owns the NFT
            setStrategies(allStrategies.slice(0, 2)); // Placeholder
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
