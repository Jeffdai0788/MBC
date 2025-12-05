import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { solanaClient, MarketplaceStats } from "../lib/solanaClient";
import StrategyCard from "../components/StrategyCard";
import StrategyFilters, { FilterState } from "../components/StrategyFilters";
import ComparisonModal from "../components/ComparisonModal";
import Leaderboard from "../components/Leaderboard";
import UserProfileModal from "../components/UserProfileModal";
import { mockStrategies } from "../lib/mockStrategyData";

export default function TraderDashboard() {
    const { publicKey } = useWallet();
    const [stats, setStats] = useState<MarketplaceStats | null>(null);
    const [strategies, setStrategies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [userStrategies, setUserStrategies] = useState<any[]>([]);

    // Profile State
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [hasProfile, setHasProfile] = useState(false);

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
        if (publicKey) {
            checkProfile();
        }
    }, [publicKey]);

    const checkProfile = async () => {
        if (!publicKey) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000"}/api/user/profile/${publicKey.toBase58()}`);
            if (res.ok) {
                setHasProfile(true);
            }
        } catch (e) {
            console.error("Error checking profile:", e);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch all strategies from API
            const allStrategies = await solanaClient.getAllStrategies();

            // Filter for listed strategies only and map to mockStrategyData format
            const listedStrategies = allStrategies
                .filter(s => s.listed)
                .map(s => {
                    // Generate deterministic mock performance based on strategy ID
                    // This ensures the same strategy always gets the same "random" data
                    const seed = s.strategyId.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
                    const random = (offset: number) => {
                        const x = Math.sin(seed + offset) * 10000;
                        return x - Math.floor(x);
                    };

                    // Generate realistic looking return
                    const baseReturn = (random(1) * 40) - 10; // -10% to +30%
                    const isPositive = baseReturn > 0;

                    // Generate price history
                    const history = [];
                    let price = 100;
                    for (let i = 0; i < 30; i++) {
                        const change = (random(i + 10) - 0.45) * 5; // Slight upward bias
                        price += change;
                        history.push(price);
                    }

                    return {
                        id: s.strategyId,
                        name: s.apiId || `Strategy ${s.strategyId.slice(0, 8)}`,
                        description: s.description || "Trading strategy",
                        category: s.category || "Crypto",
                        strategyType: "Event-Driven",
                        returns: {
                            "1D": baseReturn * 0.1,
                            "5D": baseReturn * 0.3,
                            "1W": baseReturn * 0.4,
                            "1M": baseReturn,
                            "1Y": baseReturn * 8,
                            "Max": baseReturn * 10
                        },
                        priceHistory: {
                            "1D": history.slice(-24),
                            "5D": history.slice(-5),
                            "1W": history.slice(-7),
                            "1M": history,
                            "1Y": history,
                            "Max": history
                        },
                        riskLevel: random(2) > 0.6 ? "High" : random(2) > 0.3 ? "Medium" : "Low",
                        sharpeRatio: 1 + random(3) * 2, // 1.0 to 3.0
                        sortinoRatio: 1.5 + random(4) * 2,
                        maxDrawdown: -(random(5) * 20), // 0% to -20%
                        volatility: 10 + random(6) * 20,
                        winRate: 0.4 + random(7) * 0.4, // 40% to 80%
                        avgWin: 0,
                        avgLoss: 0,
                        bullMarketPerf: 0,
                        bearMarketPerf: 0,
                        creator: s.creator,
                        subscribers: Math.floor(random(8) * 1000),
                        listPrice: s.listPrice / 1_000_000,
                        createdAt: new Date(s.lastUpdateTs * 1000).toISOString().split('T')[0],
                        status: "active"
                    };
                });

            setStrategies(listedStrategies);

            // Fetch marketplace stats
            const statsData = await solanaClient.getMarketplaceStats();
            setStats(statsData);
        } catch (e) {
            console.error(e);
            setStrategies([]);
        } finally {
            setLoading(false);
        }
    };

    const loadUserStrategies = () => {
        try {
            const stored = localStorage.getItem('userCreatedStrategies');
            if (stored) {
                const strategies = JSON.parse(stored);
                setUserStrategies(strategies);
            }
        } catch (e) {
            console.error('Error loading user strategies:', e);
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

    const selectedStrategies = strategies.filter(s => selectedIds.includes(s.id));

    // Filter and Sort Logic
    const filteredStrategies = useMemo(() => {
        let result = [...strategies];

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
    }, [filters, strategies]);

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
