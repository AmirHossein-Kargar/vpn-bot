import validateWithCommas from "../utils/validationAmount.js";
import {setSession} from "../config/sessionStore.js";

const handleBankAmount = async (bot, msg, session) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  const validation = validateWithCommas(text);

  if (!validation.valid) {
    await bot.sendMessage(chatId, validation.message);
    return;
  }

  const rawAmount = msg.text.trim()
  const CARD_NUMBER = process.env.CARD_NUMBER;

  const sent = await bot.sendMessage(
    chatId,
    `💳 لطفاً مبلغ ${rawAmount} تومان را به شماره کارت زیر واریز کنید:\n\n` +
      `🔢 شماره کارت: <code>${CARD_NUMBER}</code>\n\n` +
      `سپس روی دکمه زیر کلیک کرده و رسید واریزی را ارسال نمایید.`,
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "📤 ارسال رسید واریزی",
              callback_data: "upload_receipt",
            },
          ],
        ],
      },
    }
  );

  await setSession(chatId, {
    ...session,
    step: "waiting_for_receipt",
    rawAmount,
    message_id: sent.message_id,
  });
};


export default handleBankAmount