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

    const { id } = req.query;

    if (!id || Array.isArray(id)) {
        return res.status(400).json({ error: 'Invalid strategy ID' });
    }

    try {
        const strategy = await solanaClient.getStrategy(id);

        if (!strategy) {
            return res.status(404).json({ error: 'Strategy not found' });
        }

        res.status(200).json(strategy);
    } catch (error: any) {
        console.error('API Strategy Fetch Error:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch strategy' });
    }
}
