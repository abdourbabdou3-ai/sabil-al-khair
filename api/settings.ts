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

        // GET - Fetch settings
        if (req.method === 'GET') {
            const [rows] = await db.query('SELECT * FROM settings WHERE id = 1');
            if ((rows as any[]).length === 0) {
                return res.status(200).json({ mosqueName: 'سبيل الخير', rip: '' });
            }
            return res.status(200).json({
                mosqueName: (rows as any[])[0].mosque_name,
                rip: (rows as any[])[0].rip
            });
        }

        // PUT - Update settings
        if (req.method === 'PUT') {
            const { mosqueName, rip } = req.body;
            await db.execute(
                'UPDATE settings SET mosque_name = ?, rip = ? WHERE id = 1',
                [mosqueName, rip]
            );
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error: any) {
        console.error('Database error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
