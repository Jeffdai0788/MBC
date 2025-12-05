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
}

/**
 * Mock strategy executor for Vercel deployment
 * vm2 is incompatible with serverless environments, so we use a simple mock
 */
export class StrategyExecutor {
    private logs: string[] = [];

    /**
     * Execute strategy code (mock version for demo)
     */
    async execute(code: string, params?: Record<string, any>): Promise<StrategyResult> {
        const startTime = Date.now();
        this.logs = [];

        try {
            // Mock execution - in production, this would run in a secure sandbox
            // For demo purposes, we simulate success and return a signal

            this.logs.push("[DEMO MODE] Strategy execution simulated");
            this.logs.push("Code length: " + code.length + " bytes");

            // Simulate some basic logic from the code
            let signal: string = "HOLD";

            // Simple heuristic based on code content
            if (code.toLowerCase().includes("buy")) {
                signal = "BUY";
                this.logs.push("Strategy suggests BUY signal");
            } else if (code.toLowerCase().includes("sell")) {
                signal = "SELL";
                this.logs.push("Strategy suggests SELL signal");
            } else {
                this.logs.push("Strategy suggests HOLD signal");
            }

            const executionTime = Date.now() - startTime;

            return {
                success: true,
                signal,
                data: {
                    logs: this.logs,
                    demo: true,
                    message: "Strategy executed successfully (demo mode)"
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
}

// Singleton
export const strategyExecutor = new StrategyExecutor();

