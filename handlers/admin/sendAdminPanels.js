import { setSession } from "../../config/sessionStore.js";

const sendAdminPanels = async (bot, chatId) => {
  const adminKeyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "➕ افزایش موجودی کاربر",
            callback_data: "admin_add_balance",
          },
        ],
        [
          { text: "📋 لیست سفارش‌ ها", callback_data: "admin_view_orders" },
          {
            text: "📤 ارسال پیام به کاربر",
            callback_data: "admin_send_message",
          },
        ],
      ],
    },
  };

  const sentMsg = await bot.sendMessage(chatId, "🔒 پنل مدیریت", adminKeyboard);

  await setSession(chatId, {
    messageId: sentMsg.message_id,
  });
};

export default sendAdminPanels;
