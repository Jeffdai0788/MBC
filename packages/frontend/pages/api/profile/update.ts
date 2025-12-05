import type { NextApiRequest, NextApiResponse } from 'next';
import { profileService } from '../../../lib/server/mockProfileService';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { walletAddress, ...data } = req.body;

        if (!walletAddress) {
            return res.status(400).json({ error: 'Wallet address is required' });
        }

        const success = await profileService.updateProfile(walletAddress, data);
        res.status(200).json({ success });
    } catch (error: any) {
        console.error('API Profile Update Error:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
