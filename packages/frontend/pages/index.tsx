import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { solanaClient, MarketplaceStats } from "../lib/solanaClient";
import StrategyCard from "../components/StrategyCard";
import StrategyFilters, { FilterState } from "../components/StrategyFilters";
import ComparisonModal from "../components/ComparisonModal";
import Leaderboard from "../components/Leaderboard";
import { mockStrategies } from "../lib/mockStrategyData";

export default function TraderDashboard() {
    const { publicKey } = useWallet();
    const [stats, setStats] = useState<MarketplaceStats | null>(null);
    const [loading, setLoading] = useState(true);

    // Comparison State
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [showComparison, setShowComparison] = useState(false);

    // Filter State
    const [filters, setFilters] = useState<FilterState>({
        search: "",
        riskLevel: [],
        categories: [],
        minReturn: 0,
        sortBy: "return"
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch real stats from backend
            const statsData = await solanaClient.getMarketplaceStats();
            setStats(statsData);
        } catch (e) {
            console.error("Error fetching data:", e);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (id: string, selected: boolean) => {
        if (selected) {
            if (selectedIds.length >= 4) {
                alert("You can compare up to 4 strategies at a time.");
                return;
            }
            setSelectedIds([...selectedIds, id]);
        } else {
            setSelectedIds(selectedIds.filter(sid => sid !== id));
        }
    };

    const selectedStrategies = mockStrategies.filter(s => selectedIds.includes(s.id));

    // Filter and Sort Logic
    const filteredStrategies = useMemo(() => {
        let result = [...mockStrategies];

        // 1. Search
        if (filters.search) {
            const q = filters.search.toLowerCase();
            result = result.filter(s =>
                s.name.toLowerCase().includes(q) ||
                s.description.toLowerCase().includes(q)
            );
        }

        // 2. Risk Level
        if (filters.riskLevel.length > 0) {
            result = result.filter(s => filters.riskLevel.includes(s.riskLevel));
        }

        // 3. Categories
        if (filters.categories.length > 0) {
            result = result.filter(s => filters.categories.includes(s.category));
        }

        // 4. Min Return (1M)
        if (filters.minReturn > 0) {
            result = result.filter(s => s.returns["1M"] >= filters.minReturn);
        }

        // 5. Sort
        result.sort((a, b) => {
            switch (filters.sortBy) {
                case "return":
                    return b.returns["1M"] - a.returns["1M"];
                case "sharpe":
                    return b.sharpeRatio - a.sharpeRatio;
                case "drawdown":
                    return b.maxDrawdown - a.maxDrawdown; // Closer to 0 is better (e.g. -5 > -20)
                case "popular":
                    return b.subscribers - a.subscribers;
                default:
                    return 0;
            }
        });

        return result;
    }, [filters]);

    return (
        <div>
            {/* Hero */}
            <section className="hero">
                <span className="text-label">Trader Dashboard</span>
                <h1 className="page-title">Discover Strategies</h1>
                <p className="page-subtitle">
                    Access curated Polymarket trading signals. Each strategy is tokenized as an NFT—hold it to unlock live signals.
                </p>
            </section>

            {/* Stats */}
            <div className="stats-row">
                <div className="stat-item">
                    <div className="stat-value">{mockStrategies.length}</div>
                    <div className="stat-label">Total Strategies</div>
                </div>
                <div className="stat-item">
                    <div className="stat-value">{mockStrategies.filter(s => s.riskLevel === "Low").length}</div>
                    <div className="stat-label">Low Risk</div>
                </div>
                <div className="stat-item">
                    <div className="stat-value">{loading ? "—" : `$${stats?.totalVolume?.toFixed(0) || 0}`}</div>
                    <div className="stat-label">Total Volume</div>
                </div>
            </div>

            <div className="dashboard-layout">
                {/* Sidebar Filters */}
                <StrategyFilters
                    filters={filters}
                    onChange={setFilters}
                    totalStrategies={filteredStrategies.length}
                />

                {/* Strategy Grid */}
                <div className="dashboard-content">
                    {filteredStrategies.length > 0 ? (
                        <div className="grid-cards">
                            {filteredStrategies.map((strategy) => (
                                <div key={strategy.id} style={{ height: "100%" }}>
                                    <StrategyCard
                                        strategy={strategy}
                                        isSelected={selectedIds.includes(strategy.id)}
                                        onSelect={(selected) => toggleSelection(strategy.id, selected)}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-results">
                            <h3>No strategies found</h3>
                            <p>Try adjusting your filters or search query.</p>
                            <button
                                className="btn btn-secondary"
                                onClick={() => setFilters({
                                    search: "",
                                    riskLevel: [],
                                    categories: [],
                                    minReturn: 0,
                                    sortBy: "return"
                                })}
                            >
                                Clear Filters
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Comparison Floating Action Button */}
            {selectedIds.length > 0 && (
                <div className="comparison-fab">
                    <div className="fab-content">
                        <span className="fab-count">{selectedIds.length} selected</span>
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={() => setShowComparison(true)}
                        >
                            Compare Strategies
                        </button>
                        <button
                            className="btn-icon"
                            onClick={() => setSelectedIds([])}
                            title="Clear selection"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            {/* Comparison Modal */}
            {showComparison && (
                <ComparisonModal
                    strategies={selectedStrategies}
                    onClose={() => setShowComparison(false)}
                    onRemove={(id) => toggleSelection(id, false)}
                />
            )}

            {/* Leaderboard Section */}
            <Leaderboard />

            <style jsx>{`
                .hero {
                    margin-bottom: var(--space-xl);
                    max-width: 560px;
                }
                .dashboard-layout {
                    display: flex;
                    gap: var(--space-xl);
                    margin-top: var(--space-xl);
                    align-items: flex-start;
                }
                .dashboard-content {
                    flex: 1;
                    min-width: 0; /* Prevent flex overflow */
                }
                .grid-cards {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: var(--space-lg);
                }
                .empty-results {
                    text-align: center;
                    padding: var(--space-2xl);
                    background: var(--color-paper);
                    border: 1px solid var(--color-paper-warm);
                    color: var(--color-ink-muted);
                }
                .empty-results h3 {
                    color: var(--color-ink);
                    margin-bottom: var(--space-sm);
                }
                .empty-results button {
                    margin-top: var(--space-lg);
                }
                .comparison-fab {
                    position: fixed;
                    bottom: 2rem;
                    right: 2rem;
                    z-index: 100;
                    animation: slideUp 0.3s ease;
                }
                .fab-content {
                    background: var(--color-ink);
                    color: var(--color-cream);
                    padding: 0.75rem 1rem;
                    border-radius: 50px;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                }
                .fab-count {
                    font-weight: 600;
                    font-size: 0.875rem;
                }
                .btn-icon {
                    background: none;
                    border: none;
                    color: rgba(255,255,255,0.7);
                    font-size: 1.25rem;
                    cursor: pointer;
                    padding: 0 4px;
                }
                .btn-icon:hover {
                    color: white;
                }
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
