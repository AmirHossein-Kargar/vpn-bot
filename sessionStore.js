const redis = require("./redisClient")

const prefix = "session:";

export async function getSession(chatId) {
  const data = await redis.get(prefix + chatId);
  return data ? JSON.parse(data) : null;
}

export async function setSession(chatId, value) {
  await redis.set(prefix + chatId, JSON.stringify(value));
}

export async function deleteSession(chatId) {
  await redis.del(prefix + chatId);
}
