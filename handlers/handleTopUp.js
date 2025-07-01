// * This function sends payment method options to the user
function handleTopUp(bot, chatId) {
  // * Main message shown to the user
  const message = "🔍 یکی از روش‌های پرداخت را انتخاب کنید";

  // * Inline keyboard with different payment options
  const topUpButtons = {
    reply_markup: {
      inline_keyboard: [
        // * Bank transfer option
        [{ text: "💳 کارت‌ به‌ کارت", callback_data: "pay_bank" }],

        // * General crypto payment option
        [{ text: "🪙 پرداخت ارز دیجیتال", callback_data: "pay_crypto" }],

        // * Use a voucher code
        [{ text: "🎟️ وارد کردن ووچر (Voucher)", callback_data: "use_voucher" }],

        // * Use TRON for payment
        [{ text: "💸 پرداخت با ترون (TRX)", callback_data: "pay_trx" }],

        // * Use TON for payment
        [{ text: "💠 پرداخت با تون (TON)", callback_data: "pay_ton" }],
      ],
    },
  };

  // * Send the message with the inline keyboard
  bot.sendMessage(chatId, message, topUpButtons);
}

module.exports = handleTopUp;
