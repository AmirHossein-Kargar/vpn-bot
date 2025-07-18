import client from "./redisClient.js";
const prefix = "session:";

export const getSession = async (userId) => {
  const data = await client.get(prefix + userId);
  return data ? JSON.parse(data) : {};
};

export const setSession = async (userId, sessionData) => {
  await client.set(prefix + userId, JSON.stringify(sessionData));
};

export const clearSession = async (userId) => {
  await client.del(prefix + userId);
}; 