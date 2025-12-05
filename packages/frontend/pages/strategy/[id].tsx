import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useWallet } from "@solana/wallet-adapter-react";
import axios from "axios";
import bs58 from "bs58";

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";

// Mock strategy data (in production, fetch from chain)
const mockStrategy = {
    id: "1",
    name: "BTC Momentum Alpha",
    description: "High-frequency momentum strategy for BTC/USDC. This strategy analyzes price momentum across multiple timeframes to identify optimal entry and exit points.",
    creator: "7xKXn8...9mPq",
    creatorFull: "7xKXn8mDp4qR2nYt9mPq",
    price: 50,
    listed: true,
    subscribers: 28,
    totalSignals: 142,
    performance: "+24.5%",
    lastMidBps: 6500,
    upperBoundBps: 7000,
    lowerBoundBps: 3000,
    lastUpdate: new Date().toISOString(),
};

export default function StrategyDetail() {
    const router = useRouter();
    const { id } = router.query;
    const { publicKey, signMessage } = useWallet();

    const [strategy] = useState(mockStrategy);
    const [ownsNft, setOwnsNft] = useState(false);
    const [loading, setLoading] = useState(false);
    const [signalData, setSignalData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // Simulate NFT ownership check
    useEffect(() => {
        if (publicKey) {
            // In production, check on-chain
            setOwnsNft(true); // For demo
        }
    }, [publicKey]);

    const handleBuy = async () => {
        if (!publicKey) {
            alert("Please connect your wallet");
            return;
        }
        setLoading(true);
        // TODO: Call smart contract to buy
        await new Promise(r => setTimeout(r, 2000));
        setOwnsNft(true);
        setLoading(false);
        alert("Strategy NFT purchased! (Demo mode)");
    };

    const getSignal = async () => {
        if (!publicKey || !signMessage) return;
        setLoading(true);
        setError(null);

        try {
            const timestamp = Date.now();
            const message = `Login to Strategy Marketplace: ${timestamp}`;
            const messageBytes = new TextEncoder().encode(message);
            const signature = await signMessage(messageBytes);
            const signatureBase58 = bs58.encode(signature);

            const res = await axios.post(`${SERVER_URL}/signal`, {
                publicKey: publicKey.toBase58(),
                signature: signatureBase58,
                timestamp: timestamp
            });

            setSignalData(res.data);
        } catch (e: any) {
            setError(e.response?.data?.error || "Failed to fetch signal");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
                        <h1 className="page-title">{strategy.name}</h1>
                        <span className="badge badge-success">{strategy.performance}</span>
                    </div>
                    <p className="page-subtitle">Created by {strategy.creator}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                    <div className="strategy-price" style={{ fontSize: "2rem" }}>{strategy.price} USDC</div>
                    {!ownsNft && publicKey && (
                        <button className="btn btn-primary" onClick={handleBuy} disabled={loading} style={{ marginTop: "0.5rem" }}>
                            {loading ? "Processing..." : "Buy Strategy NFT"}
                        </button>
                    )}
                    {ownsNft && (
                        <span className="badge badge-success" style={{ marginTop: "0.5rem", display: "inline-block" }}>
                            ✓ You own this NFT
                        </span>
                    )}
                </div>
            </div>

            <div className="grid-2">
                {/* Left Column */}
                <div>
                    {/* Description */}
                    <div className="card" style={{ marginBottom: "1.5rem" }}>
                        <h2 className="card-title">About This Strategy</h2>
                        <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, marginTop: "1rem" }}>
                            {strategy.description}
                        </p>
                    </div>

                    {/* Parameters */}
                    <div className="card">
                        <h2 className="card-title">Strategy Parameters</h2>
                        <div style={{ marginTop: "1rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem 0", borderBottom: "1px solid var(--border-color)" }}>
                                <span style={{ color: "var(--text-secondary)" }}>Upper Bound</span>
                                <span style={{ fontWeight: 600 }}>{(strategy.upperBoundBps / 100).toFixed(0)}%</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem 0", borderBottom: "1px solid var(--border-color)" }}>
                                <span style={{ color: "var(--text-secondary)" }}>Lower Bound</span>
                                <span style={{ fontWeight: 600 }}>{(strategy.lowerBoundBps / 100).toFixed(0)}%</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem 0", borderBottom: "1px solid var(--border-color)" }}>
                                <span style={{ color: "var(--text-secondary)" }}>Current Mid Price</span>
                                <span style={{ fontWeight: 600 }}>{(strategy.lastMidBps / 100).toFixed(2)}%</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem 0" }}>
                                <span style={{ color: "var(--text-secondary)" }}>Last Update</span>
                                <span style={{ fontWeight: 600 }}>{new Date(strategy.lastUpdate).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div>
                    {/* Stats */}
                    <div className="card" style={{ marginBottom: "1.5rem" }}>
                        <h2 className="card-title">Performance</h2>
                        <div className="stat-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", marginTop: "1rem" }}>
                            <div className="stat-card">
                                <div className="stat-value" style={{ color: "var(--success)" }}>{strategy.performance}</div>
                                <div className="stat-label">ROI</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value">{strategy.subscribers}</div>
                                <div className="stat-label">Subscribers</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value">{strategy.totalSignals}</div>
                                <div className="stat-label">Signals Sent</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value">98%</div>
                                <div className="stat-label">Uptime</div>
                            </div>
                        </div>
                    </div>

                    {/* Signal Panel */}
                    <div className="card">
                        <h2 className="card-title">Live Signal</h2>

                        {!publicKey ? (
                            <p style={{ color: "var(--text-secondary)", marginTop: "1rem" }}>
                                Connect your wallet to access signals
                            </p>
                        ) : !ownsNft ? (
                            <p style={{ color: "var(--text-secondary)", marginTop: "1rem" }}>
                                Purchase this strategy NFT to access live signals
                            </p>
                        ) : (
                            <div style={{ marginTop: "1rem" }}>
                                <button
                                    className="btn btn-primary"
                                    onClick={getSignal}
                                    disabled={loading}
                                    style={{ width: "100%", marginBottom: "1rem" }}
                                >
                                    {loading ? "Fetching..." : "Get Latest Signal"}
                                </button>

                                {error && (
                                    <div style={{ padding: "1rem", background: "rgba(239, 68, 68, 0.1)", borderRadius: "0.5rem", color: "var(--error)" }}>
                                        {error}
                                    </div>
                                )}

                                {signalData && (
                                    <div className="signal-display">
                                        <div className={`signal-indicator ${signalData.signal === "BUY_YES" ? "signal-buy" :
                                                signalData.signal === "SELL_YES" ? "signal-sell" : "signal-hold"
                                            }`}>
                                            {signalData.signal === "BUY_YES" ? "📈" :
                                                signalData.signal === "SELL_YES" ? "📉" : "⏸️"}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>
                                                {signalData.signal}
                                            </div>
                                            <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                                                {signalData.description}
                                            </div>
                                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                                                Updated: {new Date(signalData.lastUpdate).toLocaleTimeString()}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
