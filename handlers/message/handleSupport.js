import { getSession, setSession } from "../../config/sessionStore.js";

const handleSupport = async (bot, chatId, userId) => {
  const supportMessage = `▫️ جهت ارتباط به صورت مستقیم:
🔰 @Swift_servicebot

‼️ قبل از ارسال پیام به پشتیبانی، قوانین و مقررات سرویس‌ دهی را مطالعه کنید.

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

  const session = (await getSession(userId)) || {};
  session.support = true;
  session.supportMessageId = tempMsg.message_id;
  await setSession(userId, session);

  setTimeout(async () => {
    await bot.deleteMessage(chatId, tempMsg.message_id);
    await bot.sendMessage(chatId, supportMessage, supportKeyboard);
  }, 1000);
};

export default handleSupport;
