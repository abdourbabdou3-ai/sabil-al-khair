import type { VercelRequest, VercelResponse } from '@vercel/node';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    uri: process.env.DATABASE_URL,
    waitForConnections: true,
    connectionLimit: 1,
    queueLimit: 0,
    ssl: {
        rejectUnauthorized: false
    }
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const connection = await pool.getConnection();

        // Fix projects table image_url column size
        await connection.query(`
            ALTER TABLE projects 
            MODIFY COLUMN image_url LONGTEXT;
        `);

        // Fix reports table description column size (good practice)
        await connection.query(`
            ALTER TABLE reports 
            MODIFY COLUMN description LONGTEXT;
        `);

        connection.release();

        res.status(200).json({
            success: true,
            message: "Database schema updated successfully. image_url is now LONGTEXT."
        });
    } catch (error: any) {
        console.error('Migration error:', error);
        res.status(500).json({ error: error.message });
    }
}
