const storage = require("node-persist");

const supportGroupId = -1002781166798;

module.exports = async function handleSupportMessage(bot, msg) {
  if (msg.chat.type !== "private") return;

  const userId = msg.from.id;
  const userName = msg.from.first_name;
  const userText = msg.text;

  const isSupport = await storage.getItem(`support_${userId}`);
  if (!isSupport) return;

  await bot.sendMessage(
    supportGroupId,
    `📩 پیام پشتیبانی از <a href="tg://user?id=${userId}">${userName}</a>:\n\n${userText}`,
    { parse_mode: "HTML" }
  );

  await bot.sendMessage(msg.chat.id, "✅ پیامت به پشتیبانی ارسال شد.");

  await storage.removeItem(`support_${userId}`)
};
