import type { VercelRequest, VercelResponse } from '@vercel/node';
import client from '../lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // GET - Fetch all reports
        if (req.method === 'GET') {
            const result = await client.execute('SELECT * FROM reports ORDER BY date DESC');
            const reports = result.rows.map(row => ({
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
            await client.execute({
                sql: 'INSERT INTO reports (id, title, description, total_collected, date) VALUES (?, ?, ?, ?, ?)',
                args: [id, title, description, totalCollected, date]
            });
            return res.status(201).json({ success: true });
        }

        // PUT - Update report
        if (req.method === 'PUT') {
            const { id, title, description } = req.body;
            await client.execute({
                sql: 'UPDATE reports SET title = ?, description = ? WHERE id = ?',
                args: [title, description, id]
            });
            return res.status(200).json({ success: true });
        }

        // DELETE - Delete report
        if (req.method === 'DELETE') {
            const { id } = req.query;
            await client.execute({
                sql: 'DELETE FROM reports WHERE id = ?',
                args: [id as string]
            });
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error: any) {
        console.error('Database error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
