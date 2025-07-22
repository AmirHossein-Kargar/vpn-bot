import { setSession } from "../../config/sessionStore.js";

// * This function sends payment method options to the user
const showPaymentMethods = async (bot, chatId) => {
  // * Main message shown to the user
  const message = "🔍 یکی از روش‌ های پرداخت را انتخاب کنید";

  // * Inline keyboard with different payment options
  const topUpButtons = {
    reply_markup: {
      inline_keyboard: [
        [{ text: "💳 کارت‌ به‌ کارت", callback_data: "pay_bank" }],

        // [{ text: "🪙 پرداخت ارز دیجیتال", callback_data: "pay_crypto" }],

        // [{ text: "🎟️ وارد کردن ووچر (Voucher)", callback_data: "pay_voucher" }],

        // [{ text: "💸 پرداخت با ترون (TRX)", callback_data: "pay_trx" }],

        // [{ text: "💠 پرداخت با تون (TON)", callback_data: "pay_ton" }],
      ],
    },
  };

  // * Send the message with the inline keyboard and disable the main keyboard
  const sentMessage = await bot.sendMessage(chatId, message, topUpButtons);

  await setSession(chatId, {
    step: "waiting_for_payment_method",
    messageId: sentMessage.message_id,
  })

  return sentMessage;
};

export default showPaymentMethods;
