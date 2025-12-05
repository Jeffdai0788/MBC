import type { NextApiRequest, NextApiResponse } from 'next';
import { polymarketClient } from '../../../lib/server/polymarketClient';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Check if searching or just listing
        if (req.query.q) {
            const query = req.query.q as string;
            const markets = await polymarketClient.searchMarkets(query);
            return res.status(200).json(markets);
        }

        const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
        const markets = await polymarketClient.getMarkets(limit);
        res.status(200).json(markets);
    } catch (error: any) {
        console.error('API Polymarket Error:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch markets' });
    }
}
