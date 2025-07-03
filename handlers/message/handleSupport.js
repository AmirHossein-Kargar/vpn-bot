const storage = require("node-persist")
const supportGroupId = -1002781166798

async function showSupportMessage(bot, chatId) {
  const supportMessage = `▫️ جهت ارتباط به صورت مستقیم:
🔰 @AmirKargaar

‼️ قبل از ارسال پیام به پشتیبانی، قوانین و مقررات سرویس‌دهی را مطالعه کنید.

📝 لطفاً پیام پشتیبانی خود را در همین چت تایپ و ارسال کنید.
`;

  const supportKeyboard = {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🏠 بازگشت به منوی اصلی", callback_data: "back_to_home" }],
      ],
    },
  };

  const tempMsg = await bot.sendMessage(chatId, "⌛ در حال بارگذاری...", {
    reply_markup: { remove_keyboard: true },
  });

  setTimeout(async () => {
    bot.deleteMessage(chatId, tempMsg.message_id);
    await bot.sendMessage(chatId, supportMessage, supportKeyboard);
  }, 1000);
};

async function startSupportSession(userId) {
await storage.setItem(`support_${userId}`, true)
}
async function isInSupportSession(userId) {
return await storage.getItem(`support_${userId}`)
}
async function endSupportSession(userId) {
await storage.removeItem(`support_${userId}`)
}
async function handleSupportMessage(bot,msg) {
  const userId = msg.from.id
  const userName = msg.from.first_name
  const userText = msg.text


  await bot.sendMessage(
    supportGroupId,
    `📩 پیام پشتیبانی از کاربر <a href="tg://user?id=${userId}">${userName}</a>:\n\n${userText}`,
    { parse_mode: "HTML" }
  );
  await bot.sendMessage(msg.chat.id, "✅ پیام شما به پشتیبانی ارسال شد. منتظر پاسخ باشید.");
  await endSupportSession(userId);
}

module.exports = {
  showSupportMessage,
  startSupportSession,
  isInSupportSession,
  handleSupportMessage,
};