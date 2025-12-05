import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

interface UserProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
    const { publicKey } = useWallet();
    const [apiKey, setApiKey] = useState("");
    const [secret, setSecret] = useState("");
    const [passphrase, setPassphrase] = useState("");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!publicKey) return;

        setLoading(true);
        setStatus("idle");

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000"}/api/user/profile`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    walletAddress: publicKey.toBase58(),
                    apiKey,
                    secret,
                    passphrase
                })
            });

            if (!res.ok) throw new Error("Failed to save profile");

            setStatus("success");
            setTimeout(onClose, 1500);
        } catch (e) {
            console.error(e);
            setStatus("error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Connect Polymarket Account</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit} className="profile-form">
                    <p className="form-desc">
                        To execute strategies automatically, we need your Polymarket API credentials.
                        These are stored securely on our server and used only for trading.
                    </p>

                    <div className="form-group">
                        <label>API Key</label>
                        <input
                            type="text"
                            value={apiKey}
                            onChange={e => setApiKey(e.target.value)}
                            placeholder="Enter your Polymarket API Key"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>API Secret</label>
                        <input
                            type="password"
                            value={secret}
                            onChange={e => setSecret(e.target.value)}
                            placeholder="Enter your Polymarket API Secret"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Passphrase</label>
                        <input
                            type="password"
                            value={passphrase}
                            onChange={e => setPassphrase(e.target.value)}
                            placeholder="Enter your Polymarket Passphrase"
                            required
                        />
                    </div>

                    {status === "error" && <p className="error-msg">Failed to save credentials. Please try again.</p>}
                    {status === "success" && <p className="success-msg">Credentials saved successfully!</p>}

                    <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? "Saving..." : "Save Credentials"}
                        </button>
                    </div>
                </form>
            </div>

            <style jsx>{`
                .modal-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    backdrop-filter: blur(4px);
                }
                .modal-content {
                    background: var(--color-paper);
                    padding: var(--space-xl);
                    border-radius: 12px;
                    width: 100%;
                    max-width: 480px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.2);
                    border: 1px solid var(--color-paper-warm);
                }
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: var(--space-lg);
                }
                .modal-header h2 {
                    margin: 0;
                    font-family: var(--font-serif);
                    font-size: 1.5rem;
                }
                .close-btn {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: var(--color-stone);
                }
                .form-desc {
                    color: var(--color-ink-muted);
                    font-size: 0.875rem;
                    margin-bottom: var(--space-lg);
                    line-height: 1.5;
                }
                .form-group {
                    margin-bottom: var(--space-md);
                }
                .form-group label {
                    display: block;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    margin-bottom: 4px;
                    color: var(--color-stone);
                }
                .form-group input {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid var(--color-paper-warm);
                    border-radius: 6px;
                    font-family: var(--font-mono);
                    font-size: 0.875rem;
                    background: var(--color-cream);
                }
                .form-group input:focus {
                    outline: none;
                    border-color: var(--color-ink);
                }
                .form-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: var(--space-md);
                    margin-top: var(--space-xl);
                }
                .error-msg { color: var(--color-error); font-size: 0.875rem; }
                .success-msg { color: var(--color-success); font-size: 0.875rem; }
            `}</style>
        </div>
    );
}
