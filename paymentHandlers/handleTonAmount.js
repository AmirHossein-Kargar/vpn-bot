const validationAmount = require("../utils/validationAmount");
const { getSession } = require("../sessionStore")

module.exports = async function handleTonAmount(bot, msg) {
  // * Extract the chat ID from the message
  const chatId = msg.chat.id;
  // * Remove any leading/trailing whitespace
  const text = msg.text.trim();

  // * Delete the user's message to keep the chat clean
  await bot.deleteMessage(chatId, msg.message_id).catch(() => {});

  const session = await getSession(chatId)

  const botMessageId = session?.messageId;

  // * If there's no message ID in the session, exit the function
  if (!botMessageId) return;

  // * Validate the amount entered by the user
  const { valid, amount, message } = validationAmount(text);

  // * If validation fails, send an error message and a button to return to the payment methodes
  if (!valid) {
    return bot.editMessageText(message, {
      chat_id: chatId,
      message_id: botMessageId,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🔙 بازگشت به روش‌های پرداخت",
              callback_data: "back_to_topup",
            },
          ],
        ],
      },
    });
  }

  // * If amount is valid, show success message with formatted amount
  await bot.editMessageText(
    `✅ مبلغ ${amount.toLocaleString()} تومان ثبت شد و فاکتور در حال ساخت است.`,
    {
      chat_id: chatId,
      message_id: botMessageId,
    }
  );
};
