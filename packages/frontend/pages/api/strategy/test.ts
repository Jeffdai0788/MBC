import type { NextApiRequest, NextApiResponse } from 'next';
import { strategyExecutor } from '../../../lib/server/strategyExecutor';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('[API] Test request received');
        const { code, params } = req.body;

        if (!code || typeof code !== 'string') {
            return res.status(400).json({ error: 'Code is required', success: false });
        }

        console.log('[API] Testing code, length:', code.length);
        const result = await strategyExecutor.execute(code, params);
        console.log('[API] Test result:', result);

        // vm2 might return non-serializable data in logs or result, but usually it manages text/primitives well.
        // If issues arise, we might need to sanitize response.
        res.status(200).json(result);
    } catch (error: any) {
        console.error('[API] Test error:', error);
        res.status(500).json({
            error: error.message || 'Internal server error',
            success: false
        });
    }
}
