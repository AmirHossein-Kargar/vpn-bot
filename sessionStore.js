const redis = require("./redisClient");

const prefix = "session:";

async function getSession(chatId) {
  const data = await redis.get(prefix + chatId);
  return data ? JSON.parse(data) : null;
}

async function setSession(chatId, value) {
  await redis.set(prefix + chatId, JSON.stringify(value));
}

async function deleteSession(chatId) {
  await redis.del(prefix + chatId);
}

module.exports = {
  getSession,
  setSession,
  deleteSession,
};
