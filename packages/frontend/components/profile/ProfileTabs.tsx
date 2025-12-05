import React from 'react';

interface ProfileTabsProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    mode: 'trader' | 'developer';
}

export default function ProfileTabs({ activeTab, onTabChange, mode }: ProfileTabsProps) {
    const tabs = mode === 'trader'
        ? [
            { id: 'items', label: 'Items' },
            { id: 'tokens', label: 'Tokens' },
            { id: 'portfolio', label: 'Portfolio' },
            { id: 'activity', label: 'Activity' }
        ]
        : [
            { id: 'created', label: 'Created' },
            { id: 'tokens', label: 'Tokens' },
            { id: 'listings', label: 'Listings' },
            { id: 'activity', label: 'Activity' }
        ];

    return (
        <div className="profile-tabs">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => onTabChange(tab.id)}
                >
                    {tab.label}
                </button>
            ))}
            <style jsx>{`
                .profile-tabs {
                    display: flex;
                    gap: var(--space-lg);
                    border-bottom: 1px solid var(--color-paper-warm);
                    margin-bottom: var(--space-lg);
                }
                .tab-btn {
                    padding: var(--space-sm) 0;
                    background: none;
                    border: none;
                    border-bottom: 2px solid transparent;
                    font-family: var(--font-sans);
                    font-size: 0.9375rem;
                    color: var(--color-ink-muted);
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .tab-btn:hover {
                    color: var(--color-ink);
                }
                .tab-btn.active {
                    color: var(--color-ink);
                    border-bottom-color: var(--color-ink);
                    font-weight: 500;
                }
            `}</style>
        </div>
    );
}
