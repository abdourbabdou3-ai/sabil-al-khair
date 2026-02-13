import mysql from 'mysql2/promise';

const SQL = `
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    target_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    current_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    is_important BOOLEAN DEFAULT FALSE,
    status ENUM('active', 'completed') DEFAULT 'active',
    created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS reports (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    total_collected DECIMAL(15,2) NOT NULL DEFAULT 0,
    date BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
    id INT PRIMARY KEY DEFAULT 1,
    mosque_name VARCHAR(255) NOT NULL DEFAULT 'سبيل الخير',
    rip VARCHAR(50) DEFAULT ''
);

CREATE TABLE IF NOT EXISTS global_balance (
    id INT PRIMARY KEY DEFAULT 1,
    amount DECIMAL(15,2) NOT NULL DEFAULT 0
);
`;

async function setup() {
    const connection = await mysql.createConnection({
        uri: 'mysql://root:sjqZiEKKRHtXBMcKsrezkbgrsHHIcxio@yamabiko.proxy.rlwy.net:51717/railway'
    });

    console.log('✅ Connected to Railway MySQL!');

    const statements = SQL.split(';').filter(s => s.trim());
    for (const statement of statements) {
        await connection.execute(statement);
        console.log('✅ Executed:', statement.substring(0, 50) + '...');
    }

    // Insert default data
    try {
        await connection.execute("INSERT INTO settings (id, mosque_name, rip) VALUES (1, 'سبيل الخير', '00799999000012345678')");
        console.log('✅ Added default settings');
    } catch (e) {
        console.log('⚠️ Settings already exist');
    }

    try {
        await connection.execute("INSERT INTO global_balance (id, amount) VALUES (1, 0)");
        console.log('✅ Added default balance');
    } catch (e) {
        console.log('⚠️ Balance already exists');
    }

    await connection.end();
    console.log('\n🎉 Database setup complete!');
}

setup().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
