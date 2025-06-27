const { setSession } = require("../sessionStore");

async function showPaymentStep(bot, chatId, messageId, { stepKey, message }) {
  await bot.deleteMessage(chatId, messageId); // * Delete previous bot message

  const sent = await bot.sendMessage(chatId, message, { // * Send new payment step message
    parsemode_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "🔙 بازگشت به روش‌های پرداخت",
            callback_data: "back_to_topup", // * Callback data to handle going back
          },
        ],
      ],
    },
  });

  await setSession(chatId, { // * Save User's step in Redis
    step: stepKey,
    messageId: sent.message_id,
  })
}

module.exports = showPaymentStep;
