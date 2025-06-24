function handleTopUp(bot, chatId) {
  const message = "🔍 یکی از روش‌های پرداخت را انتخاب کنید";

  const topUpButtons = {
    reply_markup: {
      inline_keyboard: [
        [{ text: "💳 کارت‌ به‌ کارت", callback_data: "pay_bank" }],
        [{ text: "🪙 پرداخت ارز دیجیتال", callback_data: "pay_crypto" }],
        [{ text: "🎟️ وارد کردن ووچر (Voucher)", callback_data: "use_voucher" }],
        [{ text: "💸 پرداخت با ترون (TRX)", callback_data: "pay_trx" }],
        [{ text: "💠 پرداخت با تون (TON)", callback_data: "pay_ton" }],
      ],
    },
  };
  


  bot.sendMessage(chatId, message, topUpButtons)
}

module.exports = handleTopUp;