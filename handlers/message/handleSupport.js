import { getSession, setSession } from "../../config/sessionStore.js";

const handleSupport = async (bot, chatId, userId) => {
  const supportMessage = `▫️ جهت ارتباط به صورت مستقیم:
🔰 @Swift_servicebot

‼️ قبل از ارسال پیام به پشتیبانی، قوانین و مقررات سرویس‌ دهی را مطالعه کنید.

📝 لطفاً پیام پشتیبانی خود را در همین چت تایپ و ارسال کنید.

✅ فایل‌های مجاز: متن، عکس، فیلم`;

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
    try {
      // Check if session still exists and support is still active
      const currentSession = await getSession(userId);
      if (!currentSession?.support) {
        // User has already left support mode, don't proceed
        return;
      }

      // Try to delete the temp message
      try {
        await bot.deleteMessage(chatId, tempMsg.message_id);
      } catch (error) {
        console.log("❗️خطا در حذف پیام موقت:", error.message);
        // Continue even if temp message deletion fails
      }

      const sentMessage = await bot.sendMessage(
        chatId,
        supportMessage,
        supportKeyboard
      );

      // Update session with the actual support message ID
      const updatedSession = await getSession(userId);
      if (updatedSession?.support) {
        updatedSession.supportMessageId = sentMessage.message_id;
        await setSession(userId, updatedSession);
      }
    } catch (error) {
      console.error("❌ خطا در handleSupport setTimeout:", error);
    }
  }, 1000);
};

export default handleSupport;
