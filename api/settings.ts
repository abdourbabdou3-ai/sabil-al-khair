import type { VercelRequest, VercelResponse } from '@vercel/node';
import client from '../lib/db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // GET - Fetch settings
        if (req.method === 'GET') {
            const result = await client.execute('SELECT * FROM settings WHERE id = 1');
            if (result.rows.length === 0) {
                return res.status(200).json({ mosqueName: 'سبيل الخير', rip: '' });
            }
            return res.status(200).json({
                mosqueName: result.rows[0].mosque_name,
                rip: result.rows[0].rip
            });
        }

        // PUT - Update settings
        if (req.method === 'PUT') {
            const { mosqueName, rip } = req.body;
            await client.execute({
                sql: 'UPDATE settings SET mosque_name = ?, rip = ? WHERE id = 1',
                args: [mosqueName, rip]
            });
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error: any) {
        console.error('Database error:', error);
        return res.status(500).json({
            error: error.message || 'Internal server error',
            env: { hasUrl: !!process.env.TURSO_DATABASE_URL, hasToken: !!process.env.TURSO_AUTH_TOKEN }
        });
    }
}
