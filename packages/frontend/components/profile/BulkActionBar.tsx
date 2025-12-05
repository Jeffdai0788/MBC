import React from 'react';

interface BulkActionBarProps {
    selectedCount: number;
    onClearSelection: () => void;
    mode: 'trader' | 'developer';
    onAction: (action: string) => void;
}

export default function BulkActionBar({ selectedCount, onClearSelection, mode, onAction }: BulkActionBarProps) {
    if (selectedCount === 0) return null;

    return (
        <div className="bulk-action-bar">
            <div className="selection-info">
                <span className="count">{selectedCount} selected</span>
                <button className="clear-btn" onClick={onClearSelection}>Clear selection</button>
            </div>

            <div className="actions">
                {mode === 'trader' ? (
                    <>
                        <button className="action-btn" onClick={() => onAction('pause')}>
                            Pause
                        </button>
                        <button className="action-btn" onClick={() => onAction('resume')}>
                            Resume
                        </button>
                        <button className="action-btn" onClick={() => onAction('capital')}>
                            Adjust Capital
                        </button>
                    </>
                ) : (
                    <>
                        <button className="action-btn" onClick={() => onAction('list')}>
                            List
                        </button>
                        <button className="action-btn" onClick={() => onAction('unlist')}>
                            Unlist
                        </button>
                        <button className="action-btn" onClick={() => onAction('price')}>
                            Update Price
                        </button>
                    </>
                )}
            </div>

            <style jsx>{`
                .bulk-action-bar {
                    position: fixed;
                    bottom: var(--space-lg);
                    left: 50%;
                    transform: translateX(-50%);
                    background: var(--color-ink);
                    color: var(--color-cream);
                    padding: var(--space-sm) var(--space-lg);
                    border-radius: 32px;
                    display: flex;
                    align-items: center;
                    gap: var(--space-xl);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    z-index: 100;
                    animation: slideUp 0.3s ease;
                }
                @keyframes slideUp {
                    from { transform: translate(-50%, 100%); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }
                .selection-info {
                    display: flex;
                    align-items: center;
                    gap: var(--space-md);
                    border-right: 1px solid rgba(255,255,255,0.2);
                    padding-right: var(--space-lg);
                }
                .count {
                    font-weight: 500;
                }
                .clear-btn {
                    background: none;
                    border: none;
                    color: rgba(255,255,255,0.7);
                    font-size: 0.875rem;
                    cursor: pointer;
                }
                .clear-btn:hover {
                    color: var(--color-cream);
                }
                .actions {
                    display: flex;
                    gap: var(--space-sm);
                }
                .action-btn {
                    background: rgba(255,255,255,0.1);
                    border: none;
                    color: var(--color-cream);
                    padding: 6px 12px;
                    border-radius: 4px;
                    font-size: 0.875rem;
                    cursor: pointer;
                    transition: background 0.2s ease;
                }
                .action-btn:hover {
                    background: rgba(255,255,255,0.2);
                }
            `}</style>
        </div>
    );
}
