import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

interface Transaction {
    signature: string;
    timestamp: number;
    action: string;
    status: "success" | "pending" | "failed";
}

export default function TransactionExplorer() {
    const { publicKey } = useWallet();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Load transactions from localStorage on mount
        loadTransactions();

        // Listen for custom events when new transactions occur
        const handleNewTransaction = (event: any) => {
            const tx = event.detail;
            addTransaction(tx);
        };

        window.addEventListener("newTransaction", handleNewTransaction);
        return () => window.removeEventListener("newTransaction", handleNewTransaction);
    }, []);

    const loadTransactions = () => {
        try {
            const stored = localStorage.getItem("recentTransactions");
            if (stored) {
                setTransactions(JSON.parse(stored));
            }
        } catch (e) {
            console.error("Error loading transactions:", e);
        }
    };

    const addTransaction = (tx: Transaction) => {
        setTransactions((prev) => {
            const updated = [tx, ...prev].slice(0, 5); // Keep last 5
            localStorage.setItem("recentTransactions", JSON.stringify(updated));
            return updated;
        });
    };

    const getExplorerUrl = (signature: string) => {
        const cluster = process.env.NEXT_PUBLIC_SOLANA_CLUSTER || "devnet";
        return `https://explorer.solana.com/tx/${signature}?cluster=${cluster}`;
    };

    const shortenSignature = (sig: string) => {
        return `${sig.slice(0, 8)}...${sig.slice(-8)}`;
    };

    const formatTime = (timestamp: number) => {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return "Just now";
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        return `${hours}h ago`;
    };

    if (!publicKey) {
        return null; // Don't show if wallet not connected
    }

    return (
        <>
            {/* Toggle Button */}
            <div className="tx-explorer-toggle" onClick={() => setIsOpen(!isOpen)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M3 12h18M3 6h18M3 18h18" strokeWidth="2" strokeLinecap="round" />
                </svg>
                {transactions.length > 0 && <span className="tx-count">{transactions.length}</span>}
            </div>

            {/* Explorer Panel */}
            {isOpen && (
                <div className="tx-explorer-panel">
                    <div className="tx-explorer-header">
                        <h3>Recent Transactions</h3>
                        <button onClick={() => setIsOpen(false)} className="tx-close">×</button>
                    </div>

                    {transactions.length === 0 ? (
                        <p className="tx-empty">No recent transactions</p>
                    ) : (
                        <div className="tx-list">
                            {transactions.map((tx, index) => (
                                <a
                                    key={`${tx.signature}-${index}`}
                                    href={getExplorerUrl(tx.signature)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="tx-item"
                                >
                                    <div className="tx-info">
                                        <div className="tx-action">{tx.action}</div>
                                        <div className="tx-sig">{shortenSignature(tx.signature)}</div>
                                    </div>
                                    <div className="tx-meta">
                                        <span className={`tx-status tx-status-${tx.status}`}>
                                            {tx.status}
                                        </span>
                                        <span className="tx-time">{formatTime(tx.timestamp)}</span>
                                    </div>
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <style jsx>{`
        .tx-explorer-toggle {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 56px;
          height: 56px;
          background: var(--color-ink);
          color: var(--color-cream);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transition: transform 0.2s ease;
          z-index: 1000;
        }

        .tx-explorer-toggle:hover {
          transform: scale(1.05);
        }

        .tx-count {
          position: absolute;
          top: -4px;
          right: -4px;
          background: var(--color-error);
          color: white;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .tx-explorer-panel {
          position: fixed;
          bottom: 92px;
          right: 24px;
          width: 380px;
          max-height: 480px;
          background: var(--color-paper);
          border: 1px solid var(--color-paper-warm);
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          z-index: 1000;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .tx-explorer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-bottom: 1px solid var(--color-paper-warm);
        }

        .tx-explorer-header h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          color: var(--color-ink);
        }

        .tx-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: var(--color-stone);
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .tx-close:hover {
          color: var(--color-ink);
        }

        .tx-empty {
          padding: 2rem;
          text-align: center;
          color: var(--color-stone);
          font-size: 0.875rem;
        }

        .tx-list {
          overflow-y: auto;
          max-height: 400px;
        }

        .tx-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.875rem 1rem;
          border-bottom: 1px solid var(--color-paper-warm);
          transition: background 0.2s ease;
          text-decoration: none;
          color: inherit;
        }

        .tx-item:hover {
          background: var(--color-paper-warm);
        }

        .tx-item:last-child {
          border-bottom: none;
        }

        .tx-info {
          flex: 1;
        }

        .tx-action {
          font-weight: 600;
          font-size: 0.875rem;
          color: var(--color-ink);
          margin-bottom: 0.25rem;
        }

        .tx-sig {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          color: var(--color-stone);
        }

        .tx-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.25rem;
        }

        .tx-status {
          font-size: 0.75rem;
          padding: 2px 8px;
          border-radius: 12px;
          font-weight: 500;
        }

        .tx-status-success {
          background: rgba(90, 122, 90, 0.2);
          color: var(--color-success);
        }

        .tx-status-pending {
          background: rgba(245, 158, 11, 0.2);
          color: var(--color-warning);
        }

        .tx-status-failed {
          background: rgba(158, 90, 90, 0.2);
          color: var(--color-error);
        }

        .tx-time {
          font-size: 0.75rem;
          color: var(--color-stone);
        }
      `}</style>
        </>
    );
}

// Helper function to add transaction from anywhere in the app
export function addTransactionToExplorer(tx: Transaction) {
    window.dispatchEvent(new CustomEvent("newTransaction", { detail: tx }));
}
