import type { VercelRequest, VercelResponse } from '@vercel/node';
import mysql from 'mysql2/promise';

// Lazy initialization of the pool
let pool: any = null;

function getPool() {
    if (!pool) {
        pool = mysql.createPool({
            uri: process.env.DATABASE_URL,
            waitForConnections: true,
            connectionLimit: 5,
            queueLimit: 0,
            ssl: {
                rejectUnauthorized: false
            }
        });
    }
    return pool;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const db = getPool();

        // GET - Fetch balance
        if (req.method === 'GET') {
            const [rows] = await db.query('SELECT amount FROM global_balance WHERE id = 1');
            if ((rows as any[]).length === 0) {
                return res.status(200).json({ amount: 0 });
            }
            return res.status(200).json({ amount: Number((rows as any[])[0].amount) });
        }

        // PUT - Update balance
        if (req.method === 'PUT') {
            const { amount } = req.body;
            await db.execute(
                'UPDATE global_balance SET amount = ? WHERE id = 1',
                [amount]
            );
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error: any) {
        console.error('Database error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
