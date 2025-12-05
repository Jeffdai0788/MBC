import React, { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/router";

export default function CreateStrategy() {
    const { publicKey } = useWallet();
    const router = useRouter();

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        apiEndpoint: "",
        price: "",
        upperBound: "70",
        lowerBound: "30",
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!publicKey) {
            alert("Please connect your wallet first");
            return;
        }

        setLoading(true);

        // TODO: Call smart contract to create strategy
        // For now, simulate creation
        await new Promise(resolve => setTimeout(resolve, 2000));

        alert("Strategy created successfully! (Demo mode)");
        setLoading(false);
        router.push("/my-strategies");
    };

    return (
        <div style={{ maxWidth: "600px" }}>
            <div className="page-header">
                <h1 className="page-title">Create Strategy</h1>
                <p className="page-subtitle">
                    Mint your trading strategy as an NFT and list it on the marketplace
                </p>
            </div>

            {!publicKey ? (
                <div className="card">
                    <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "2rem" }}>
                        Please connect your wallet to create a strategy
                    </p>
                </div>
            ) : (
                <form onSubmit={handleSubmit}>
                    <div className="card" style={{ marginBottom: "1.5rem" }}>
                        <h2 className="card-title" style={{ marginBottom: "1.5rem" }}>Strategy Details</h2>

                        <div className="form-group">
                            <label className="form-label">Strategy Name</label>
                            <input
                                type="text"
                                name="name"
                                className="form-input"
                                placeholder="e.g., BTC Momentum Alpha"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea
                                name="description"
                                className="form-input"
                                placeholder="Describe your strategy and what makes it unique..."
                                value={formData.description}
                                onChange={handleChange}
                                rows={3}
                                required
                                style={{ resize: "vertical" }}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">API Endpoint (Optional)</label>
                            <input
                                type="url"
                                name="apiEndpoint"
                                className="form-input"
                                placeholder="https://your-api.com/signals"
                                value={formData.apiEndpoint}
                                onChange={handleChange}
                            />
                            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                                External API that provides your trading signals
                            </p>
                        </div>
                    </div>

                    <div className="card" style={{ marginBottom: "1.5rem" }}>
                        <h2 className="card-title" style={{ marginBottom: "1.5rem" }}>Pricing & Parameters</h2>

                        <div className="form-group">
                            <label className="form-label">List Price (USDC)</label>
                            <input
                                type="number"
                                name="price"
                                className="form-input"
                                placeholder="50"
                                value={formData.price}
                                onChange={handleChange}
                                min="1"
                                required
                            />
                        </div>

                        <div className="grid-2">
                            <div className="form-group">
                                <label className="form-label">Upper Bound (%)</label>
                                <input
                                    type="number"
                                    name="upperBound"
                                    className="form-input"
                                    value={formData.upperBound}
                                    onChange={handleChange}
                                    min="50"
                                    max="100"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Lower Bound (%)</label>
                                <input
                                    type="number"
                                    name="lowerBound"
                                    className="form-input"
                                    value={formData.lowerBound}
                                    onChange={handleChange}
                                    min="0"
                                    max="50"
                                />
                            </div>
                        </div>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            Bounds define the threshold for BUY/SELL signals
                        </p>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                        style={{ width: "100%" }}
                    >
                        {loading ? "Creating Strategy..." : "Create & Mint Strategy NFT"}
                    </button>
                </form>
            )}
        </div>
    );
}
