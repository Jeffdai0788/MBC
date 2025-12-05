import type { NextApiRequest, NextApiResponse } from 'next';
import { ipfsClient } from '../../../lib/server/ipfsClient';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { code, metadata } = req.body;

        if (!code || typeof code !== 'string') {
            return res.status(400).json({ error: 'Code is required' });
        }

        const result = await ipfsClient.uploadCode(code, metadata);

        if (!result.success) {
            return res.status(500).json({ error: result.error || 'Upload failed' });
        }

        res.status(200).json({
            success: true,
            cid: result.cid,
            url: result.url
        });
    } catch (error: any) {
        console.error('API Strategy Upload Error:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
