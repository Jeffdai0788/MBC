import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import { solanaClient, StrategyData } from "../../lib/solanaClient";

export default function MyStrategies() {
    const { publicKey } = useWallet();
    const [strategies, setStrategies] = useState<StrategyData[]>([]);
    const [loading, setLoading] = useState(true);
    const [listingStrategy, setListingStrategy] = useState<StrategyData | null>(null);
    const [listPrice, setListPrice] = useState("");
    const [listing, setListing] = useState(false);

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

    const handleListStrategy = async () => {
        if (!listingStrategy || !listPrice || !publicKey) return;

        setListing(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000"}/api/strategy/list`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    strategyId: listingStrategy.strategyId, // Use the ID (UUID for local)
                    price: parseFloat(listPrice),
                    walletAddress: publicKey.toBase58()
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to list strategy");
            }

            // Refresh list
            await fetchMyStrategies();
            setListingStrategy(null);
            setListPrice("");
        } catch (e) {
            console.error("Error listing strategy:", e);
            alert("Failed to list strategy");
        } finally {
            setListing(false);
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
            <header className="page-header">
                <span className="text-label">Your Strategies</span>
                <h1 className="page-title">Portfolio</h1>
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
                                        {strategy.apiId || `Strategy ${strategy.strategyId.slice(0, 8)}`}
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
                                    {strategy.listed ? (
                                        <Link href={`/strategy/${strategy.publicKey}`} className="btn btn-secondary" style={{ padding: "0.5rem 1rem" }}>
                                            View
                                        </Link>
                                    ) : (
                                        <button
                                            className="btn btn-primary"
                                            style={{ padding: "0.5rem 1rem", fontSize: "0.75rem" }}
                                            onClick={() => setListingStrategy(strategy)}
                                        >
                                            List for Sale
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Listing Modal */}
            {listingStrategy && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3 style={{ marginBottom: "var(--space-md)" }}>List Strategy</h3>
                        <p className="text-body" style={{ marginBottom: "var(--space-lg)" }}>
                            Set a price for <strong>{listingStrategy.apiId || "your strategy"}</strong>.
                        </p>

                        <div className="form-group">
                            <label className="form-label">Price (USDC)</label>
                            <input
                                type="number"
                                className="form-input"
                                placeholder="100"
                                value={listPrice}
                                onChange={(e) => setListPrice(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div style={{ display: "flex", gap: "var(--space-sm)", marginTop: "var(--space-xl)" }}>
                            <button
                                className="btn btn-secondary"
                                onClick={() => {
                                    setListingStrategy(null);
                                    setListPrice("");
                                }}
                                disabled={listing}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleListStrategy}
                                disabled={listing || !listPrice}
                            >
                                {listing ? "Listing..." : "Confirm Listing"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 100;
                }
                .modal {
                    background: var(--color-cream);
                    padding: var(--space-xl);
                    width: 100%;
                    max-width: 400px;
                    border: 1px solid var(--color-paper-warm);
                }
            `}</style>
        </div>
    );
}
