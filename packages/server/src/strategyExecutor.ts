import { VM } from "vm2";
import { polymarketClient, PolymarketClient } from "./polymarketClient";
import { ipfsClient } from "./ipfsClient";

export interface StrategyResult {
    success: boolean;
    signal?: "BUY" | "SELL" | "HOLD" | string;
    data?: any;
    error?: string;
    executionTime?: number;
}

export interface StrategyContext {
    polymarket: PolymarketClient;
    log: (...args: any[]) => void;
    // Add more context as needed
}

const EXECUTION_TIMEOUT = 5000; // 5 seconds max

/**
 * Execute user-submitted strategy code in a sandboxed environment
 */
export class StrategyExecutor {
    private logs: string[] = [];

    /**
     * Execute strategy code directly (for testing)
     */
    async execute(code: string, params?: Record<string, any>): Promise<StrategyResult> {
        const startTime = Date.now();
        this.logs = [];

        try {
            // Create sandbox with limited API access
            const sandbox = this.createSandbox();

            // Add params to sandbox before VM creation
            sandbox.params = params || {};

            // Create VM with security restrictions
            const vm = new VM({
                timeout: EXECUTION_TIMEOUT,
                sandbox,
                eval: false,
                wasm: false
            });

            // Wrap user code in async function and execute
            const wrappedCode = `
                (async () => {
                    ${code}
                    
                    // Call the signal function if defined
                    if (typeof signal === 'function') {
                        return await signal(polymarket, params);
                    }
                    return "HOLD";
                })()
            `;

            const result = await vm.run(wrappedCode);
            const executionTime = Date.now() - startTime;

            // Normalize signal
            const signal = this.normalizeSignal(result);

            return {
                success: true,
                signal,
                data: {
                    raw: result,
                    logs: this.logs
                },
                executionTime
            };
        } catch (e: any) {
            return {
                success: false,
                error: e.message || "Execution failed",
                data: { logs: this.logs },
                executionTime: Date.now() - startTime
            };
        }
    }

    /**
     * Execute strategy from IPFS CID
     */
    async executeFromIPFS(cid: string, params?: Record<string, any>): Promise<StrategyResult> {
        try {
            const data = await ipfsClient.fetchCode(cid);
            if (!data) {
                return {
                    success: false,
                    error: `Strategy not found: ${cid}`
                };
            }
            return this.execute(data.code, params);
        } catch (e: any) {
            return {
                success: false,
                error: e.message || "Failed to fetch strategy"
            };
        }
    }

    /**
     * Create sandboxed context for strategy execution
     */
    private createSandbox(): StrategyContext & Record<string, any> {
        const self = this;

        return {
            // Polymarket client (read-only for safety)
            polymarket: {
                getMarkets: (limit?: number) => polymarketClient.getMarkets(limit),
                getMarket: (id: string) => polymarketClient.getMarket(id),
                searchMarkets: (query: string) => polymarketClient.searchMarkets(query),
                getPrices: (id: string) => polymarketClient.getPrices(id),
                getHistoricalPrices: (id: string, days?: number) =>
                    polymarketClient.getHistoricalPrices(id, days),
                getPositions: (address: string) => polymarketClient.getPositions(address),
                getPortfolioValue: (address: string) => polymarketClient.getPortfolioValue(address),
                // Trading (mock mode)
                placeBuyOrder: (params: any) => polymarketClient.placeBuyOrder(params),
                placeSellOrder: (params: any) => polymarketClient.placeSellOrder(params)
            } as PolymarketClient,

            // Logging
            log: (...args: any[]) => {
                const message = args.map(a =>
                    typeof a === "object" ? JSON.stringify(a) : String(a)
                ).join(" ");
                self.logs.push(message);
                console.log("[Strategy]", message);
            },
            console: {
                log: (...args: any[]) => {
                    const message = args.map(a =>
                        typeof a === "object" ? JSON.stringify(a) : String(a)
                    ).join(" ");
                    self.logs.push(message);
                }
            },

            // Utilities
            Math,
            Date,
            JSON,
            Array,
            Object,
            String,
            Number,
            Boolean,
            Promise,
            setTimeout: undefined, // Disabled for security
            setInterval: undefined,
            fetch: undefined, // Use polymarket client instead
        };
    }

    /**
     * Normalize strategy output to standard signal
     */
    private normalizeSignal(result: any): string {
        if (typeof result === "string") {
            const upper = result.toUpperCase();
            if (["BUY", "SELL", "HOLD", "BUY_YES", "SELL_YES", "BUY_NO", "SELL_NO"].includes(upper)) {
                return upper;
            }
        }
        if (typeof result === "object" && result?.signal) {
            return this.normalizeSignal(result.signal);
        }
        if (typeof result === "number") {
            if (result > 0.6) return "BUY";
            if (result < 0.4) return "SELL";
            return "HOLD";
        }
        if (typeof result === "boolean") {
            return result ? "BUY" : "SELL";
        }
        return "HOLD";
    }
}

// Singleton
export const strategyExecutor = new StrategyExecutor();
