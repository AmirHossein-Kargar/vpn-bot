const validationAmount = require("../utils/validationAmount");
module.exports = async function handleTonAmount(bot, msg) {
  const text = msg.text.trim();
  const chatId = msg.chat.id;

  const { valid, amount, message } = validationAmount(text, 50000, 5000000);

  bot.deleteMessage();

  if (!valid) {
    return bot.editMessageText(message, {
      chat_id: chatId,
      message_id: msg.message_id,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🔙 بازگشت به روش‌ های پرداخت",
              callback_data: "back_to_topup",
            },
          ],
        ],
      },
    });
  }

  await bot.editMessageText(
    `✅ مبلغ ${amount.toLocaleString()} تومان ثبت شد و فاکتور در حال ساخت است.`,
    {
      chat_id: chatId,
      message_id: msg.message_id,
    }
  );
};
