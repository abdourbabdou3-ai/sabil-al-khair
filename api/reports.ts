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
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const db = getPool();

        // GET - Fetch all reports
        if (req.method === 'GET') {
            const [rows] = await db.query('SELECT * FROM reports ORDER BY date DESC');
            const reports = (rows as any[]).map(row => ({
                id: row.id,
                title: row.title,
                description: row.description,
                totalCollected: Number(row.total_collected),
                date: Number(row.date)
            }));
            return res.status(200).json(reports);
        }

        // POST - Create new report
        if (req.method === 'POST') {
            const { id, title, description, totalCollected, date } = req.body;
            await db.execute(
                'INSERT INTO reports (id, title, description, total_collected, date) VALUES (?, ?, ?, ?, ?)',
                [id, title, description, totalCollected, date]
            );
            return res.status(201).json({ success: true });
        }

        // PUT - Update report
        if (req.method === 'PUT') {
            const { id, title, description } = req.body;
            await db.execute(
                'UPDATE reports SET title = ?, description = ? WHERE id = ?',
                [title, description, id]
            );
            return res.status(200).json({ success: true });
        }

        // DELETE - Delete report
        if (req.method === 'DELETE') {
            const { id } = req.query;
            await db.execute('DELETE FROM reports WHERE id = ?', [id]);
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error: any) {
        console.error('Database error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
