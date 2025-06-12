function handleTopUp(bot, chatId) {
  const message = "🔍 یکی از روش‌های پرداخت را انتخاب کنید";

    const options = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "💸 پرداخت با ترون", callback_data: "pay_tron" },
          { text: "💸 پرداخت با تون", callback_data: "pay_ton" }
        ],
        [
          { text: "🎟 استفاده از ووچر", callback_data: "use_voucher" }
        ]
      ]
    }
  };

  bot.sendMessage(chatId, message, options)
}

module.exports = handleTopUp;