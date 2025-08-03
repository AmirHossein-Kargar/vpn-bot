import { createClient } from 'redis';

const client = createClient({
    username: 'default',
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
});

client.on('error', err => console.log('\x1b[41m\x1b[37m❌ Redis Client Error:\x1b[0m', err));

await client.connect();

await client.set('foo', 'bar');
const result = await client.get('foo');
console.log(`\x1b[32m✔ Redis test value:\x1b[0m \x1b[1m${result}\x1b[0m`); // >>> bar

export default client;
