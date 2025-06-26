const sessions = require("./sessions");

async function showPaymentStep(bot, chatId, messageId, { stepKey, message }) {
  await bot.deleteMessage(chatId, messageId);

  const sent = await bot.sendMessage(chatId, message, {
   parsemode_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [{ text: "🔙 بازگشت به روش‌های پرداخت", callback_data: "back_to_topup" }],
      ],
    },
  });

  sessions[chatId] = {
    step: stepKey,
    messageId: sent.message_id,
  };
}

module.exports = showPaymentStep;
