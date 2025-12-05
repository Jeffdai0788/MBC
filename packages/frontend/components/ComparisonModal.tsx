import React from "react";
import { StrategyMetrics, categoryColors } from "../lib/mockStrategyData";
import Sparkline from "./Sparkline";

interface ComparisonModalProps {
    strategies: StrategyMetrics[];
    onClose: () => void;
    onRemove: (id: string) => void;
}

export default function ComparisonModal({ strategies, onClose, onRemove }: ComparisonModalProps) {
    if (strategies.length === 0) return null;

    const metrics = [
        { label: "Category", key: "category", format: (v: any) => v },
        { label: "Risk Level", key: "riskLevel", format: (v: any) => v },
        { label: "1M Return", key: "returns", subKey: "1M", format: (v: any) => `${v > 0 ? "+" : ""}${v.toFixed(2)}%` },
        { label: "Sharpe Ratio", key: "sharpeRatio", format: (v: number) => v.toFixed(2) },
        { label: "Max Drawdown", key: "maxDrawdown", format: (v: number) => `${v.toFixed(1)}%` },
        { label: "Win Rate", key: "winRate", format: (v: number) => `${Math.round(v * 100)}%` },
        { label: "Subscribers", key: "subscribers", format: (v: number) => v },
        { label: "Price", key: "listPrice", format: (v: number) => `${v} USDC` },
    ];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Compare Strategies</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="comparison-table-container">
                    <table className="comparison-table">
                        <thead>
                            <tr>
                                <th>Metric</th>
                                {strategies.map(s => (
                                    <th key={s.id} className="strategy-header">
                                        <div className="header-content">
                                            <span className="strategy-name">{s.name}</span>
                                            <button
                                                className="remove-btn"
                                                onClick={() => onRemove(s.id)}
                                                title="Remove from comparison"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {/* Performance Chart Row */}
                            <tr>
                                <td className="metric-label">1M Performance</td>
                                {strategies.map(s => (
                                    <td key={s.id} className="chart-cell">
                                        <Sparkline
                                            data={s.priceHistory["1M"]}
                                            width={160}
                                            height={50}
                                            color={s.returns["1M"] >= 0 ? "var(--color-success)" : "var(--color-error)"}
                                        />
                                    </td>
                                ))}
                            </tr>

                            {/* Metrics Rows */}
                            {metrics.map(metric => (
                                <tr key={metric.label}>
                                    <td className="metric-label">{metric.label}</td>
                                    {strategies.map(s => {
                                        const val = metric.subKey ? (s as any)[metric.key][metric.subKey] : (s as any)[metric.key];
                                        return (
                                            <td key={s.id} className="metric-value">
                                                {metric.key === "category" ? (
                                                    <span
                                                        className="category-badge"
                                                        style={{
                                                            backgroundColor: `${categoryColors[val]}20`,
                                                            color: categoryColors[val]
                                                        }}
                                                    >
                                                        {val}
                                                    </span>
                                                ) : metric.format(val)}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

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
                    z-index: 1000;
                    backdrop-filter: blur(4px);
                }
                .modal-content {
                    background: var(--color-paper);
                    border: 1px solid var(--color-paper-warm);
                    border-radius: 12px;
                    width: 90%;
                    max-width: 1000px;
                    max-height: 90vh;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.2);
                }
                .modal-header {
                    padding: var(--space-lg);
                    border-bottom: 1px solid var(--color-paper-warm);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .modal-header h2 {
                    margin: 0;
                    font-family: var(--font-serif);
                }
                .close-btn {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: var(--color-stone);
                }
                .comparison-table-container {
                    overflow-x: auto;
                    padding: var(--space-lg);
                }
                .comparison-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .comparison-table th, .comparison-table td {
                    padding: 1rem;
                    text-align: left;
                    border-bottom: 1px solid var(--color-paper-warm);
                }
                .comparison-table th {
                    min-width: 200px;
                }
                .comparison-table th:first-child {
                    min-width: 150px;
                    width: 150px;
                }
                .header-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .strategy-name {
                    font-family: var(--font-serif);
                    font-size: 1.125rem;
                }
                .remove-btn {
                    background: none;
                    border: none;
                    color: var(--color-stone);
                    cursor: pointer;
                    font-size: 1.25rem;
                    padding: 0 4px;
                }
                .remove-btn:hover {
                    color: var(--color-error);
                }
                .metric-label {
                    font-size: 0.875rem;
                    color: var(--color-ink-muted);
                    font-weight: 500;
                }
                .metric-value {
                    font-family: var(--font-mono);
                    font-size: 0.9375rem;
                }
                .category-badge {
                    font-size: 0.75rem;
                    font-weight: 600;
                    padding: 2px 8px;
                    border-radius: 4px;
                    text-transform: uppercase;
                }
                .chart-cell {
                    padding: 0.5rem 1rem;
                }
            `}</style>
        </div>
    );
}
