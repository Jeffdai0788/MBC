import React, { useState } from 'react';

interface FilterSectionProps {
    title: string;
    children: React.ReactNode;
    defaultExpanded?: boolean;
}

const FilterSection = ({ title, children, defaultExpanded = true }: FilterSectionProps) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    return (
        <div className="filter-section">
            <button
                className="filter-header"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <span className="filter-title">{title}</span>
                <span className={`filter-icon ${isExpanded ? 'expanded' : ''}`}>▼</span>
            </button>
            {isExpanded && (
                <div className="filter-content">
                    {children}
                </div>
            )}
            <style jsx>{`
                .filter-section {
                    border-bottom: 1px solid var(--color-paper-warm);
                    padding: var(--space-md) 0;
                }
                .filter-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    width: 100%;
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: var(--space-xs) 0;
                }
                .filter-title {
                    font-family: var(--font-sans);
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: var(--color-ink);
                }
                .filter-icon {
                    font-size: 0.625rem;
                    color: var(--color-stone);
                    transition: transform 0.2s ease;
                }
                .filter-icon.expanded {
                    transform: rotate(180deg);
                }
                .filter-content {
                    padding-top: var(--space-sm);
                }
            `}</style>
        </div>
    );
};

interface ProfileSidebarProps {
    filters: any;
    onFilterChange: (key: string, value: any) => void;
    counts?: Record<string, number>;
    mode: 'trader' | 'developer';
}

export default function ProfileSidebar({ filters, onFilterChange, counts, mode }: ProfileSidebarProps) {
    return (
        <aside className="profile-sidebar">
            <div className="sidebar-header">
                <h3>Filters</h3>
                <button className="clear-btn" onClick={() => onFilterChange('clear', null)}>
                    Clear All
                </button>
            </div>

            <FilterSection title="Status">
                <div className="checkbox-group">
                    {mode === 'trader' ? (
                        <>
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={filters.status?.includes('active')}
                                    onChange={() => onFilterChange('status', 'active')}
                                />
                                <span>Active</span>
                                <span className="count">{counts?.active || 0}</span>
                            </label>
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={filters.status?.includes('paused')}
                                    onChange={() => onFilterChange('status', 'paused')}
                                />
                                <span>Paused</span>
                                <span className="count">{counts?.paused || 0}</span>
                            </label>
                        </>
                    ) : (
                        <>
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={filters.status?.includes('listed')}
                                    onChange={() => onFilterChange('status', 'listed')}
                                />
                                <span>Listed</span>
                                <span className="count">{counts?.listed || 0}</span>
                            </label>
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={filters.status?.includes('unlisted')}
                                    onChange={() => onFilterChange('status', 'unlisted')}
                                />
                                <span>Unlisted</span>
                                <span className="count">{counts?.unlisted || 0}</span>
                            </label>
                        </>
                    )}
                </div>
            </FilterSection>

            <FilterSection title="Category">
                <div className="checkbox-group">
                    {['Politics', 'Crypto', 'Sports', 'Entertainment'].map(cat => (
                        <label key={cat} className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={filters.category?.includes(cat)}
                                onChange={() => onFilterChange('category', cat)}
                            />
                            <span>{cat}</span>
                            <span className="count">{counts?.[cat.toLowerCase()] || 0}</span>
                        </label>
                    ))}
                </div>
            </FilterSection>

            <FilterSection title="Performance">
                <div className="checkbox-group">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={filters.performance?.includes('profitable')}
                            onChange={() => onFilterChange('performance', 'profitable')}
                        />
                        <span>Profitable</span>
                    </label>
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={filters.performance?.includes('loss_making')}
                            onChange={() => onFilterChange('performance', 'loss_making')}
                        />
                        <span>Loss-making</span>
                    </label>
                </div>
            </FilterSection>

            <FilterSection title="Risk Level">
                <div className="checkbox-group">
                    {['Low', 'Medium', 'High'].map(risk => (
                        <label key={risk} className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={filters.risk?.includes(risk)}
                                onChange={() => onFilterChange('risk', risk)}
                            />
                            <span>{risk}</span>
                        </label>
                    ))}
                </div>
            </FilterSection>

            <style jsx>{`
                .profile-sidebar {
                    width: 280px;
                    flex-shrink: 0;
                    border-right: 1px solid var(--color-paper-warm);
                    padding-right: var(--space-lg);
                    height: 100%;
                }
                .sidebar-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: var(--space-md);
                    padding-bottom: var(--space-sm);
                    border-bottom: 1px solid var(--color-paper-warm);
                }
                .sidebar-header h3 {
                    font-size: 1rem;
                    margin: 0;
                }
                .clear-btn {
                    background: none;
                    border: none;
                    color: var(--color-ink-muted);
                    font-size: 0.75rem;
                    cursor: pointer;
                    text-decoration: underline;
                }
                .checkbox-group {
                    display: flex;
                    flex-direction: column;
                    gap: var(--space-sm);
                }
                .checkbox-label {
                    display: flex;
                    align-items: center;
                    gap: var(--space-sm);
                    font-size: 0.875rem;
                    color: var(--color-ink);
                    cursor: pointer;
                }
                .checkbox-label input {
                    cursor: pointer;
                }
                .count {
                    margin-left: auto;
                    color: var(--color-stone);
                    font-size: 0.75rem;
                }
            `}</style>
        </aside>
    );
}
