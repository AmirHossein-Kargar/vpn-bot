const { createClient } = require("redis");

let client;

async function getRedisClient() {
  if (!client) {
    client = createClient({
      username: process.env.REDIS_USERNAME,
      password: process.env.REDIS_PASSWORD,
      socket: {
        host: process.env.REDIS_HOST,
        port: 14166,
      },
    });
  }
  client.on("error", (err) => console.error("❌ Redis Error:", err));

  await client
    .connect()
    .then(() => console.log("✅ Redis connected"))
    .catch(console.error);

  return client;
}

module.exports = getRedisClient;
