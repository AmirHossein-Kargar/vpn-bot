const storage = require("node-persist");

async function initSessionStore() {
  await storage.init({
    dir: "sessions",
    stringify: JSON.stringify,
    parse: JSON.parse,
    encoding: "utf8",
    logging: false,
    ttl: false,
  });
  console.log("✅ node-persist session store initialized");
}

async function getSession(chatId) {
  const data = await storage.getItem(`session:${chatId}`);
  return data || {};
}

async function setSession(chatId, value) {
  await storage.setItem(`session:${chatId}`, value);
}

async function deleteSession(chatId) {
  await storage.removeItem(`session:${chatId}`);
}

module.exports = {
  storage,
  initSessionStore,
  getSession,
  setSession,
  deleteSession,
};
