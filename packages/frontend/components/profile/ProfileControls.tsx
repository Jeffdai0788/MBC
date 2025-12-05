import React from 'react';

interface ProfileControlsProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    sortOption: string;
    onSortChange: (option: string) => void;
    viewMode: 'grid' | 'list';
    onViewModeChange: (mode: 'grid' | 'list') => void;
    itemCount: number;
    mode: 'trader' | 'developer';
    onToggleSidebar: () => void;
    isSidebarOpen: boolean;
}

export default function ProfileControls({
    searchQuery,
    onSearchChange,
    sortOption,
    onSortChange,
    viewMode,
    onViewModeChange,
    itemCount,
    mode,
    onToggleSidebar,
    isSidebarOpen
}: ProfileControlsProps) {
    return (
        <div className="profile-controls">
            {/* Filter Toggle */}
            <button
                className={`filter-toggle-btn ${isSidebarOpen ? 'active' : ''}`}
                onClick={onToggleSidebar}
                title="Toggle Filters"
            >
                <span className="icon">⚡</span>
                <span className="label">Filters</span>
            </button>

            {/* Search */}
            <div className="search-wrapper">
                <span className="search-icon">🔍</span>
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search strategies..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>

            {/* Sort */}
            <div className="control-group">
                <select
                    className="control-select"
                    value={sortOption}
                    onChange={(e) => onSortChange(e.target.value)}
                >
                    <option value="recent">Recently {mode === 'trader' ? 'Acquired' : 'Created'}</option>
                    <option value="performance">Performance</option>
                    <option value="winRate">Win Rate</option>
                    {mode === 'trader' ? (
                        <option value="capital">Capital Deployed</option>
                    ) : (
                        <>
                            <option value="subscribers">Subscribers</option>
                            <option value="revenue">Revenue</option>
                        </>
                    )}
                </select>
            </div>

            {/* View Mode */}
            <div className="view-toggle">
                <button
                    className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                    onClick={() => onViewModeChange('grid')}
                    title="Grid View"
                >
                    ⊞
                </button>
                <button
                    className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                    onClick={() => onViewModeChange('list')}
                    title="List View"
                >
                    ☰
                </button>
            </div>

            <div className="item-count">
                {itemCount} {itemCount === 1 ? 'Item' : 'Items'}
            </div>

            <style jsx>{`
                .profile-controls {
                    display: flex;
                    gap: var(--space-md);
                    align-items: center;
                    margin-bottom: var(--space-lg);
                    padding: var(--space-sm);
                    background: var(--color-paper);
                    border: 1px solid var(--color-paper-warm);
                    border-radius: 8px;
                }
                .filter-toggle-btn {
                    display: flex;
                    align-items: center;
                    gap: var(--space-xs);
                    background: none;
                    border: none;
                    padding: 0 var(--space-md);
                    height: 32px;
                    border-right: 1px solid var(--color-paper-warm);
                    cursor: pointer;
                    color: var(--color-stone);
                    transition: all 0.2s ease;
                }
                .filter-toggle-btn:hover {
                    color: var(--color-ink);
                    background: var(--color-paper-warm);
                }
                .filter-toggle-btn.active {
                    color: var(--color-ink);
                    background: var(--color-paper-warm);
                }
                .filter-toggle-btn .icon {
                    font-size: 1rem;
                }
                .filter-toggle-btn .label {
                    font-family: var(--font-sans);
                    font-size: 0.75rem;
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .search-wrapper {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    gap: var(--space-xs);
                    padding: 0 var(--space-sm);
                    border-right: 1px solid var(--color-paper-warm);
                }
                .search-input {
                    border: none;
                    background: none;
                    width: 100%;
                    padding: var(--space-xs);
                    font-family: var(--font-sans);
                    font-size: 0.875rem;
                    color: var(--color-ink);
                }
                .search-input:focus {
                    outline: none;
                }
                .control-group {
                    padding: 0 var(--space-sm);
                    border-right: 1px solid var(--color-paper-warm);
                }
                .control-select {
                    border: none;
                    background: none;
                    font-family: var(--font-sans);
                    font-size: 0.875rem;
                    color: var(--color-ink);
                    cursor: pointer;
                    padding-right: var(--space-md);
                }
                .view-toggle {
                    display: flex;
                    gap: 4px;
                    padding: 0 var(--space-sm);
                    border-right: 1px solid var(--color-paper-warm);
                }
                .view-btn {
                    background: none;
                    border: none;
                    padding: 4px 8px;
                    cursor: pointer;
                    font-size: 1.25rem;
                    color: var(--color-stone);
                    border-radius: 4px;
                }
                .view-btn.active {
                    color: var(--color-ink);
                    background: var(--color-paper-warm);
                }
                .item-count {
                    font-family: var(--font-mono);
                    font-size: 0.75rem;
                    color: var(--color-stone);
                    padding-right: var(--space-sm);
                }
            `}</style>
        </div>
    );
}
