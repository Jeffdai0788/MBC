import type { NextApiRequest, NextApiResponse } from 'next';
import { ipfsClient } from '../../../lib/server/ipfsClient';

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
        console.log('[API] Upload request received');
        const { code, metadata } = req.body;

        if (!code || typeof code !== 'string') {
            console.error('[API] Invalid code provided');
            return res.status(400).json({ error: 'Code is required', success: false });
        }

        console.log('[API] Uploading code, length:', code.length);
        const result = await ipfsClient.uploadCode(code, metadata);
        console.log('[API] Upload result:', result);

        if (!result.success) {
            console.error('[API] Upload failed:', result.error);
            return res.status(500).json({ error: result.error || 'Upload failed', success: false });
        }

        console.log('[API] Upload successful, CID:', result.cid);
        res.status(200).json({
            success: true,
            cid: result.cid,
            url: result.url
        });
    } catch (error: any) {
        console.error('[API] Upload error:', error);
        res.status(500).json({
            error: error.message || 'Internal server error',
            success: false,
            details: error.stack
        });
    }
}
