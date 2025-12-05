import type { NextApiRequest, NextApiResponse } from 'next';
import { profileService } from '../../../../lib/server/mockProfileService';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { address } = req.query;

        if (!address || typeof address !== 'string') {
            return res.status(400).json({ error: 'Address is required' });
        }

        const stats = profileService.getDeveloperStats(address);
        res.status(200).json(stats);
    } catch (error: any) {
        console.error('API Developer Stats Error:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
