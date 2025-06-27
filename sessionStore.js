const getRedisClient = require("./redisClient");

const prefix = "session:";

async function getSession(chatId) {
  const client = await getRedisClient();
  const data = await client.get(prefix + chatId);
  return data ? JSON.parse(data) : null;
}

async function setSession(chatId, value) {
  const client = await getRedisClient();
  await client.set(prefix + chatId, JSON.stringify(value));
}

async function deleteSession(chatId) {
  const client = await getRedisClient();
  await client.del(prefix + chatId);
}

module.exports = {
  getSession,
  setSession,
  deleteSession,
};
