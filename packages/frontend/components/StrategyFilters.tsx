import React from "react";

export interface FilterState {
    search: string;
    riskLevel: string[];
    categories: string[];
    minReturn: number;
    sortBy: "return" | "sharpe" | "drawdown" | "popular";
}

interface StrategyFiltersProps {
    filters: FilterState;
    onChange: (filters: FilterState) => void;
    totalStrategies: number;
}

const RISK_LEVELS = ["Low", "Medium", "High"];
const CATEGORIES = ["Politics", "Crypto", "Sports", "Finance", "AI", "Weather"];

export default function StrategyFilters({ filters, onChange, totalStrategies }: StrategyFiltersProps) {

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange({ ...filters, search: e.target.value });
    };

    const toggleRisk = (risk: string) => {
        const newRisk = filters.riskLevel.includes(risk)
            ? filters.riskLevel.filter(r => r !== risk)
            : [...filters.riskLevel, risk];
        onChange({ ...filters, riskLevel: newRisk });
    };

    const toggleCategory = (cat: string) => {
        const newCats = filters.categories.includes(cat)
            ? filters.categories.filter(c => c !== cat)
            : [...filters.categories, cat];
        onChange({ ...filters, categories: newCats });
    };

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onChange({ ...filters, sortBy: e.target.value as any });
    };

    return (
        <aside className="filters-sidebar">
            <div className="filters-header">
                <h3 className="filters-title">Filters</h3>
                <span className="result-count">{totalStrategies} results</span>
            </div>

            {/* Search */}
            <div className="filter-group">
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search strategies..."
                    value={filters.search}
                    onChange={handleSearchChange}
                />
            </div>

            {/* Sort */}
            <div className="filter-group">
                <label className="filter-label">Sort By</label>
                <select
                    className="sort-select"
                    value={filters.sortBy}
                    onChange={handleSortChange}
                >
                    <option value="return">Highest Return</option>
                    <option value="sharpe">Best Sharpe Ratio</option>
                    <option value="drawdown">Lowest Drawdown</option>
                    <option value="popular">Most Popular</option>
                </select>
            </div>

            {/* Risk Level */}
            <div className="filter-group">
                <label className="filter-label">Risk Level</label>
                <div className="checkbox-group">
                    {RISK_LEVELS.map(risk => (
                        <label key={risk} className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={filters.riskLevel.includes(risk)}
                                onChange={() => toggleRisk(risk)}
                            />
                            <span className="checkbox-text">{risk} Risk</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Categories */}
            <div className="filter-group">
                <label className="filter-label">Market Category</label>
                <div className="checkbox-group">
                    {CATEGORIES.map(cat => (
                        <label key={cat} className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={filters.categories.includes(cat)}
                                onChange={() => toggleCategory(cat)}
                            />
                            <span className="checkbox-text">{cat}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Min Return Slider */}
            <div className="filter-group">
                <label className="filter-label">
                    Min Monthly Return: {filters.minReturn}%
                </label>
                <input
                    type="range"
                    min="0"
                    max="50"
                    step="1"
                    value={filters.minReturn}
                    onChange={(e) => onChange({ ...filters, minReturn: parseInt(e.target.value) })}
                    className="range-input"
                />
            </div>

            <style jsx>{`
                .filters-sidebar {
                    width: 260px;
                    flex-shrink: 0;
                    padding-right: var(--space-lg);
                    border-right: 1px solid var(--color-paper-warm);
                }
                .filters-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: baseline;
                    margin-bottom: var(--space-lg);
                }
                .filters-title {
                    font-family: var(--font-serif);
                    font-size: 1.125rem;
                    margin: 0;
                }
                .result-count {
                    font-size: 0.75rem;
                    color: var(--color-stone);
                }
                .filter-group {
                    margin-bottom: var(--space-xl);
                }
                .filter-label {
                    display: block;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: var(--color-stone);
                    margin-bottom: var(--space-sm);
                }
                .search-input {
                    width: 100%;
                    padding: 0.5rem;
                    border: 1px solid var(--color-paper-warm);
                    background: var(--color-paper);
                    font-family: var(--font-sans);
                    font-size: 0.875rem;
                    color: var(--color-ink);
                }
                .search-input:focus {
                    outline: none;
                    border-color: var(--color-ink);
                }
                .sort-select {
                    width: 100%;
                    padding: 0.5rem;
                    border: 1px solid var(--color-paper-warm);
                    background: var(--color-paper);
                    font-family: var(--font-sans);
                    font-size: 0.875rem;
                    color: var(--color-ink);
                    cursor: pointer;
                }
                .checkbox-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                .checkbox-label {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    cursor: pointer;
                }
                .checkbox-text {
                    font-size: 0.875rem;
                    color: var(--color-ink);
                }
                .range-input {
                    width: 100%;
                    cursor: pointer;
                }
            `}</style>
        </aside>
    );
}
