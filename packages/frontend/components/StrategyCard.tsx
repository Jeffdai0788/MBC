import React, { useState } from "react";
import Link from "next/link";
import Sparkline from "./Sparkline";
import MetricTooltip from "./MetricTooltip";
import { StrategyMetrics, categoryColors } from "../lib/mockStrategyData";

interface StrategyCardProps {
    strategy: StrategyMetrics;
    onSelect?: (selected: boolean) => void;
    isSelected?: boolean;
}

type TimePeriod = "1D" | "5D" | "1W" | "1M" | "1Y" | "Max";

export default function StrategyCard({ strategy, onSelect, isSelected = false }: StrategyCardProps) {
    const [period, setPeriod] = useState<TimePeriod>("1M");
    const [isHovered, setIsHovered] = useState(false);

    const formatPercent = (val: number) => {
        const sign = val >= 0 ? "+" : "";
        return `${sign}${val.toFixed(2)}%`;
    };

    const getReturnColor = (val: number) => {
        if (val > 0) return "var(--color-success)";
        if (val < 0) return "var(--color-error)";
        return "var(--color-ink-muted)";
    };

    const currentReturn = strategy.returns[period];
    const currentHistory = strategy.priceHistory[period];

    return (
        <article
            className={`strategy-card-enhanced ${isSelected ? "selected" : ""}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Selection Checkbox */}
            {onSelect && (
                <div className="selection-overlay">
                    <label className="checkbox-container">
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => onSelect(e.target.checked)}
                        />
                        <span className="checkmark"></span>
                        <span className="compare-label">Compare</span>
                    </label>
                </div>
            )}
            {/* Header */}
            <div className="card-header">
                <div className="header-top">
                    <span
                        className="category-badge"
                        style={{
                            backgroundColor: `${categoryColors[strategy.category]}20`,
                            color: categoryColors[strategy.category]
                        }}
                    >
                        {strategy.category}
                    </span>
                    <span className={`risk-badge risk-${strategy.riskLevel.toLowerCase()}`}>
                        {strategy.riskLevel} Risk
                    </span>
                </div>
                <Link href={`/strategy/${strategy.id}`} className="strategy-link">
                    <h3 className="strategy-name">{strategy.name}</h3>
                </Link>
                <p className="strategy-desc">{strategy.description}</p>
            </div>

            {/* Performance Chart Area */}
            <div className="chart-area">
                <div className="chart-header">
                    <div className="return-value" style={{ color: getReturnColor(currentReturn) }}>
                        {formatPercent(currentReturn)}
                    </div>
                    <div className="time-selector">
                        {(["1D", "1W", "1M", "1Y", "Max"] as TimePeriod[]).map((p) => (
                            <button
                                key={p}
                                className={`time-btn ${period === p ? "active" : ""}`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    setPeriod(p);
                                }}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="sparkline-container">
                    <Sparkline
                        data={currentHistory}
                        width={340}
                        height={60}
                        color={getReturnColor(currentReturn)}
                    />
                </div>
            </div>



            // Inside StrategyCard component...

            {/* Key Metrics Grid */}
            <div className="metrics-grid">
                <div className="metric-item">
                    <MetricTooltip
                        label="Sharpe Ratio"
                        description="Measure of risk-adjusted return. Higher is better (>1 is good, >2 is excellent)."
                    >
                        <span className="metric-label">Sharpe</span>
                    </MetricTooltip>
                    <span className="metric-value">{strategy.sharpeRatio.toFixed(2)}</span>
                </div>
                <div className="metric-item">
                    <MetricTooltip
                        label="Max Drawdown"
                        description="The largest percentage drop from a peak to a trough. Lower is better."
                    >
                        <span className="metric-label">Drawdown</span>
                    </MetricTooltip>
                    <span className="metric-value error">{strategy.maxDrawdown.toFixed(1)}%</span>
                </div>
                <div className="metric-item">
                    <MetricTooltip
                        label="Win Rate"
                        description="The percentage of trades that resulted in a profit."
                    >
                        <span className="metric-label">Win Rate</span>
                    </MetricTooltip>
                    <span className="metric-value">{Math.round(strategy.winRate * 100)}%</span>
                </div>
                <div className="metric-item">
                    <MetricTooltip
                        label="Subscribers"
                        description="Number of traders currently following this strategy."
                    >
                        <span className="metric-label">Subscribers</span>
                    </MetricTooltip>
                    <span className="metric-value">{strategy.subscribers}</span>
                </div>
            </div>

            {/* Footer */}
            <div className="card-footer">
                <div className="creator-info">
                    <span className="creator-label">By</span>
                    <span className="creator-name">{strategy.creator}</span>
                </div>
                <div className="price-tag">
                    {strategy.listPrice} USDC
                </div>
            </div>

            <style jsx>{`
                .strategy-card-enhanced {
                    background: var(--color-paper);
                    border: 1px solid var(--color-paper-warm);
                    border-radius: 12px;
                    padding: 1.25rem;
                    transition: all 0.2s ease;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    height: 100%;
                    position: relative;
                }
                .strategy-card-enhanced:hover {
                    border-color: var(--color-ink-muted);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                }
                .strategy-card-enhanced.selected {
                    border-color: var(--color-ink);
                    background: var(--color-paper-warm);
                }
                
                .selection-overlay {
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    z-index: 10;
                    opacity: 0;
                    transition: opacity 0.2s ease;
                }
                .strategy-card-enhanced:hover .selection-overlay,
                .strategy-card-enhanced.selected .selection-overlay {
                    opacity: 1;
                }
                
                .checkbox-container {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    cursor: pointer;
                    background: var(--color-paper);
                    padding: 4px 8px;
                    border-radius: 4px;
                    border: 1px solid var(--color-paper-warm);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                }
                .compare-label {
                    font-size: 0.75rem;
                    font-weight: 500;
                    color: var(--color-ink);
                }
                .header-top {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 0.75rem;
                }
                .category-badge {
                    font-size: 0.75rem;
                    font-weight: 600;
                    padding: 2px 8px;
                    border-radius: 4px;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .risk-badge {
                    font-size: 0.75rem;
                    font-weight: 500;
                    padding: 2px 8px;
                    border-radius: 4px;
                    background: var(--color-paper-warm);
                    color: var(--color-ink-muted);
                }
                .risk-low { color: var(--color-success); background: rgba(90, 122, 90, 0.1); }
                .risk-medium { color: var(--color-warning); background: rgba(245, 158, 11, 0.1); }
                .risk-high { color: var(--color-error); background: rgba(158, 90, 90, 0.1); }

                .strategy-name {
                    font-family: var(--font-serif);
                    font-size: 1.25rem;
                    margin: 0 0 0.5rem 0;
                    color: var(--color-ink);
                    line-height: 1.2;
                }
                .strategy-desc {
                    font-size: 0.875rem;
                    color: var(--color-ink-muted);
                    margin: 0;
                    line-height: 1.5;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                
                .chart-area {
                    margin: 0.5rem 0;
                }
                .chart-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: baseline;
                    margin-bottom: 0.5rem;
                }
                .return-value {
                    font-family: var(--font-mono);
                    font-size: 1.125rem;
                    font-weight: 600;
                }
                .time-selector {
                    display: flex;
                    gap: 4px;
                }
                .time-btn {
                    background: none;
                    border: none;
                    font-size: 0.75rem;
                    color: var(--color-stone);
                    cursor: pointer;
                    padding: 2px 4px;
                    border-radius: 4px;
                }
                .time-btn:hover { color: var(--color-ink); }
                .time-btn.active {
                    background: var(--color-paper-warm);
                    color: var(--color-ink);
                    font-weight: 500;
                }

                .metrics-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 0.5rem;
                    padding: 0.75rem 0;
                    border-top: 1px solid var(--color-paper-warm);
                    border-bottom: 1px solid var(--color-paper-warm);
                }
                .metric-item {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }
                .metric-label {
                    font-size: 0.6875rem;
                    color: var(--color-stone);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .metric-value {
                    font-family: var(--font-mono);
                    font-size: 0.875rem;
                    color: var(--color-ink);
                }
                .metric-value.error { color: var(--color-error); }

                .card-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 0.875rem;
                }
                .creator-info {
                    color: var(--color-ink-muted);
                }
                .creator-name {
                    color: var(--color-ink);
                    margin-left: 4px;
                }
                .price-tag {
                    font-weight: 600;
                    color: var(--color-ink);
                }
            `}</style>
        </article>
    );
}
