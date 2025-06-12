function handleTopUp(bot, chatId) {
  const message = "🔍 یکی از روش‌های پرداخت را انتخاب کنید";

   const topUpButtons = {
  reply_markup: {
    inline_keyboard: [
      [{ text: "💸 پرداخت با ترون (TRX)", callback_data: "pay_trx" }],
      [{ text: "💠 پرداخت با تون (TON)", callback_data: "pay_ton" }],
      [{ text: "🎟️ وارد کردن ووچر (Voucher)", callback_data: "use_voucher" }],
    ],
  },
};


  bot.sendMessage(chatId, message, topUpButtons)
}

module.exports = handleTopUp;