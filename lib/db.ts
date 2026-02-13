import mysql from 'mysql2/promise';

// Create a connection pool for better performance
const pool = mysql.createPool({
    uri: process.env.DATABASE_URL,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

export default pool;
