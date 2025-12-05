import React, { useState } from "react";

interface MetricTooltipProps {
    label: string;
    description: string;
    children: React.ReactNode;
}

export default function MetricTooltip({ label, description, children }: MetricTooltipProps) {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div
            className="tooltip-container"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            {isVisible && (
                <div className="tooltip-popup">
                    <div className="tooltip-header">{label}</div>
                    <div className="tooltip-body">{description}</div>
                </div>
            )}

            <style jsx>{`
                .tooltip-container {
                    position: relative;
                    cursor: help;
                }
                .tooltip-popup {
                    position: absolute;
                    bottom: 100%;
                    left: 50%;
                    transform: translateX(-50%);
                    margin-bottom: 8px;
                    background: var(--color-ink);
                    color: var(--color-cream);
                    padding: 8px 12px;
                    border-radius: 6px;
                    width: 200px;
                    z-index: 100;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                    pointer-events: none;
                    animation: fadeIn 0.2s ease;
                }
                .tooltip-popup::after {
                    content: "";
                    position: absolute;
                    top: 100%;
                    left: 50%;
                    margin-left: -6px;
                    border-width: 6px;
                    border-style: solid;
                    border-color: var(--color-ink) transparent transparent transparent;
                }
                .tooltip-header {
                    font-size: 0.75rem;
                    font-weight: 600;
                    margin-bottom: 4px;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .tooltip-body {
                    font-size: 0.75rem;
                    line-height: 1.4;
                    color: rgba(255, 255, 255, 0.8);
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateX(-50%) translateY(4px); }
                    to { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
            `}</style>
        </div>
    );
}
