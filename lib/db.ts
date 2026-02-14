import { createClient } from '@libsql/client';

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

// Create the client
const client = createClient({
    url: url || '',
    authToken: authToken || '',
});

export default client;
