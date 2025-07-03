const { storage } = require("../../config/sessionStore");

async function handleSupport(bot, chatId, userId) {
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
    await storage.setItem(`support_${userId}`, true)
  }, 1000);
};
module.exports = handleSupport;