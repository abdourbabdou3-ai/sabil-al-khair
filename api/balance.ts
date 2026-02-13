import type { VercelRequest, VercelResponse } from '@vercel/node';
import client from '../lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // GET - Fetch balance
        if (req.method === 'GET') {
            const result = await client.execute('SELECT amount FROM global_balance WHERE id = 1');
            if (result.rows.length === 0) {
                return res.status(200).json({ amount: 0 });
            }
            return res.status(200).json({ amount: Number(result.rows[0].amount) });
        }

        // PUT - Update balance
        if (req.method === 'PUT') {
            const { amount } = req.body;
            await client.execute({
                sql: 'UPDATE global_balance SET amount = ? WHERE id = 1',
                args: [amount]
            });
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error: any) {
        console.error('Database error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
