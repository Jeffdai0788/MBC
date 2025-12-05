import type { NextApiRequest, NextApiResponse } from 'next';
import { strategyExecutor } from '../../../../lib/server/strategyExecutor';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { code, params } = req.body;

        if (!code || typeof code !== 'string') {
            return res.status(400).json({ error: 'Code is required' });
        }

        const result = await strategyExecutor.execute(code, params);

        // vm2 might return non-serializable data in logs or result, but usually it manages text/primitives well.
        // If issues arise, we might need to sanitize response.
        res.status(200).json(result);
    } catch (error: any) {
        console.error('API Strategy Test Error:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
