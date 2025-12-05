import React, { useState } from "react";
import dynamic from "next/dynamic";

// Dynamic import Monaco to avoid SSR issues
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface StrategyEditorProps {
    value: string;
    onChange: (code: string) => void;
    onTest?: () => void;
    testResult?: {
        success: boolean;
        signal?: string;
        error?: string;
        executionTime?: number;
        data?: { logs?: string[] };
    };
    testing?: boolean;
}

const DEFAULT_CODE = `// Trading Strategy for Polymarket
// Available: polymarket.getMarkets(), polymarket.getPrices(id), etc.

async function signal(polymarket) {
    // Fetch active markets
    const markets = await polymarket.getMarkets(5);
    
    // Example: Find markets with high volume
    const highVolumeMarket = markets.find(m => 
        parseFloat(m.volume) > 100000
    );
    
    if (highVolumeMarket) {
        const prices = await polymarket.getPrices(highVolumeMarket.id);
        
        // Simple momentum strategy
        if (prices.yes < 0.3) {
            log("Found undervalued YES at", prices.yes);
            return "BUY";
        }
        if (prices.yes > 0.7) {
            log("Found overvalued YES at", prices.yes);
            return "SELL";
        }
    }
    
    return "HOLD";
}
`;

const API_REFERENCE = `
/* ═══════════════════════════════════════════════════════
   POLYMARKET API REFERENCE
   ═══════════════════════════════════════════════════════

   // Market Data
   polymarket.getMarkets(limit?)         → Market[]
   polymarket.getMarket(conditionId)     → Market
   polymarket.searchMarkets(query)       → Market[]
   polymarket.getPrices(conditionId)     → { yes, no }
   polymarket.getHistoricalPrices(id, days?) → PricePoint[]
   
   // User Data
   polymarket.getPositions(address)      → Position[]
   polymarket.getPortfolioValue(address) → number
   
   // Trading (mock mode for demo)
   polymarket.placeBuyOrder({ marketId, outcome, size, price })
   polymarket.placeSellOrder({ marketId, outcome, size, price })
   
   // Utilities
   log(...args)                          → void
   
   // Your signal function must return one of:
   "BUY" | "SELL" | "HOLD" | "BUY_YES" | "SELL_YES"
   
   ═══════════════════════════════════════════════════════ */
`;

export default function StrategyEditor({
    value,
    onChange,
    onTest,
    testResult,
    testing
}: StrategyEditorProps) {
    const [showReference, setShowReference] = useState(false);

    const handleEditorChange = (val: string | undefined) => {
        onChange(val || "");
    };

    return (
        <div className="strategy-editor">
            {/* Toolbar */}
            <div className="editor-toolbar">
                <div className="editor-toolbar-left">
                    <span className="text-label">Strategy Code</span>
                </div>
                <div className="editor-toolbar-right">
                    <button
                        type="button"
                        className="btn-text"
                        onClick={() => setShowReference(!showReference)}
                    >
                        {showReference ? "Hide" : "Show"} API Reference
                    </button>
                    <button
                        type="button"
                        className="btn-text"
                        onClick={() => onChange(DEFAULT_CODE)}
                    >
                        Reset to Template
                    </button>
                </div>
            </div>

            {/* API Reference Panel */}
            {showReference && (
                <div className="editor-reference">
                    <pre>{API_REFERENCE}</pre>
                </div>
            )}

            {/* Monaco Editor */}
            <div className="editor-container">
                <Editor
                    height="400px"
                    language="javascript"
                    theme="vs-dark"
                    value={value}
                    onChange={handleEditorChange}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        fontFamily: "'JetBrains Mono', monospace",
                        lineNumbers: "on",
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 2,
                        wordWrap: "on"
                    }}
                />
            </div>

            {/* Test Button & Results */}
            <div className="editor-actions">
                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={onTest}
                    disabled={testing || !value}
                >
                    {testing ? "Testing..." : "Test Strategy"}
                </button>

                {testResult && (
                    <div className={`test-result ${testResult.success ? "success" : "error"}`}>
                        {testResult.success ? (
                            <>
                                <div className="test-signal">
                                    Signal: <strong>{testResult.signal}</strong>
                                </div>
                                {testResult.executionTime && (
                                    <div className="test-time">
                                        Executed in {testResult.executionTime}ms
                                    </div>
                                )}
                                {testResult.data?.logs && testResult.data.logs.length > 0 && (
                                    <div className="test-logs">
                                        <div className="test-logs-title">Logs:</div>
                                        {testResult.data.logs.map((log, i) => (
                                            <div key={i} className="test-log">{log}</div>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="test-error">
                                Error: {testResult.error}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <style jsx>{`
                .strategy-editor {
                    border: 1px solid var(--color-paper-warm);
                    background: var(--color-paper);
                }
                .editor-toolbar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.75rem 1rem;
                    border-bottom: 1px solid var(--color-paper-warm);
                }
                .editor-toolbar-right {
                    display: flex;
                    gap: 1rem;
                }
                .btn-text {
                    background: none;
                    border: none;
                    font-size: 0.75rem;
                    color: var(--color-ink-muted);
                    cursor: pointer;
                    text-decoration: underline;
                }
                .btn-text:hover {
                    color: var(--color-ink);
                }
                .editor-reference {
                    padding: 1rem;
                    background: var(--color-ink);
                    color: var(--color-stone);
                    font-family: var(--font-mono);
                    font-size: 0.75rem;
                    overflow-x: auto;
                    max-height: 200px;
                }
                .editor-reference pre {
                    margin: 0;
                }
                .editor-container {
                    border-top: 1px solid var(--color-paper-warm);
                }
                .editor-actions {
                    padding: 1rem;
                    border-top: 1px solid var(--color-paper-warm);
                }
                .test-result {
                    margin-top: 1rem;
                    padding: 1rem;
                    font-size: 0.875rem;
                }
                .test-result.success {
                    background: rgba(90, 122, 90, 0.1);
                    border-left: 3px solid var(--color-success);
                }
                .test-result.error {
                    background: rgba(158, 90, 90, 0.1);
                    border-left: 3px solid var(--color-error);
                }
                .test-signal {
                    font-family: var(--font-mono);
                }
                .test-time {
                    font-size: 0.75rem;
                    color: var(--color-stone);
                    margin-top: 0.5rem;
                }
                .test-logs {
                    margin-top: 0.75rem;
                    padding-top: 0.75rem;
                    border-top: 1px solid var(--color-paper-warm);
                }
                .test-logs-title {
                    font-size: 0.6875rem;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    color: var(--color-stone);
                    margin-bottom: 0.5rem;
                }
                .test-log {
                    font-family: var(--font-mono);
                    font-size: 0.75rem;
                    color: var(--color-ink-muted);
                }
                .test-error {
                    color: var(--color-error);
                }
            `}</style>
        </div>
    );
}

export { DEFAULT_CODE };
