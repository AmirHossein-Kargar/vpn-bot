const sendAdminPanels = async (bot, chatId, messageId) => {
const adminKeyboard = {
    reply_markup: {
inline_keyboard: [
    [
        { text: "➕ افزایش موجودی کاربر", callback_data: "admin_add_balance" },
        // { text: "✅ تأیید رسید‌ها", callback_data: "admin_confirm_receipts" },
      ],
      [
        { text: "📋 لیست سفارش‌ ها", callback_data: "admin_view_orders" },
        { text: "📤 ارسال پیام به کاربر", callback_data: "admin_send_message" },
        { text: "🔄 بازگشت به منو اصلی", callback_data: "admin_back_to_main" },
    ]
]        
    }
}

  await bot.sendMessage(chatId, "🔒 پنل مدیریت", adminKeyboard);
};

export default sendAdminPanels;