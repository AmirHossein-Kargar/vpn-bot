const { createClient } = require("redis");

const client = createClient({
  userName: "amirkargar",
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: "redis-14166.c328.europe-west3-1.gce.redns.redis-cloud.com",
    port: 14166,
  },
});

client.on("error", (err) => console.error("❌ Redis Error:", err));

await client.connect();

export default client;
