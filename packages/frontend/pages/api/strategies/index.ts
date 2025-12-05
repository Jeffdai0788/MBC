import type { NextApiRequest, NextApiResponse } from 'next';
import { SolanaClient } from '../../../lib/server/solanaClient';

const solanaClient = new SolanaClient();

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Determine if we need to fetch specific strategy or all
        // Ideally we would split this but for now getting all is fine
        const strategies = await solanaClient.getAllStrategies();
        res.status(200).json(strategies);
    } catch (error: any) {
        console.error('API Strategy Fetch Error:', error);
        // Return empty array on error so UI doesn't crash, or 500
        res.status(500).json({ error: error.message || 'Failed to fetch strategies' });
    }
}
