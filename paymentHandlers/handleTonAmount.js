const validationAmount = require("../utils/validationAmount");
const sessions = require("../sessions");

module.exports = async function handleTonAmount(bot, msg) {
  const chatId = msg.chat.id;
  const text = msg.text.trim();

  await bot.deleteMessage(chatId, msg.message_id);

  const session = sessions[chatId];
  const botMessageId = session?.messageId;

  if (!botMessageId) return;

  const { valid, amount, message } = validationAmount(text);

  if (!valid) {
    return bot.editMessageText(message, {
      chat_id: chatId,
      message_id: botMessageId,
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔙 بازگشت به روش‌های پرداخت", callback_data: "back_to_topup" }],
        ],
      },
    });
  }

  await bot.editMessageText(
    `✅ مبلغ ${amount.toLocaleString()} تومان ثبت شد و فاکتور در حال ساخت است.`,
    {
      chat_id: chatId,
      message_id: botMessageId,
    }
  );

};
