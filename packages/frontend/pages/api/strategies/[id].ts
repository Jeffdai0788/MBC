import type { NextApiRequest, NextApiResponse } from 'next';
import { mockStrategies } from '../../../lib/mockStrategyData';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const { id } = req.query;

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // First check localStorage user strategies
        // Since we can't access localStorage server-side, we'll only check mock data for now

        // Find strategy in mock data
        const strategy = mockStrategies.find(s => s.id === id);

        if (strategy) {
            // Convert to blockchain format expected by the detail page
            return res.status(200).json({
                publicKey: `strat_${strategy.id}`,
                strategyId: strategy.id,
                apiId: strategy.name,
                creator: strategy.creator,
                strategyMint: `mint_${strategy.id}`,
                paymentMint: "USDC_MINT_ADDRESS",
                listed: strategy.status === "listed",
                listPrice: strategy.listPrice * 1_000_000, // Convert to smallest unit
                seller: strategy.creator,
                lastMidBps: Math.floor(Math.random() * 10000),
                lastUpdateTs: Math.floor(Date.now() / 1000),
            });
        }

        // Strategy not found
        return res.status(404).json({ error: 'Strategy not found' });
    } catch (error: any) {
        console.error('[API] Error fetching strategy:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
