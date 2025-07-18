import { setSession } from "../config/sessionStore.js";

const showPaymentStep = async (
  bot,
  chatId,
  messageId,
  { stepkey, message, keyboard }
) => {
  try {
    await bot.deleteMessage(chatId, messageId).catch(() => {});

    const sent = await bot.sendMessage(chatId, message, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: keyboard.length
          ? keyboard
          : [
              [
                {
                  text: "🔙 بازگشت به روش‌های پرداخت",
                  callback_data: "back_to_topup",
                },
              ],
            ],
      },
    });
    await setSession(chatId, {
      step: stepkey,
      messageId: sent.message_id,
    });
  } catch (error) {
    console.log("❌ showPaymentStep error:", error);
  }
};

export default showPaymentStep;
