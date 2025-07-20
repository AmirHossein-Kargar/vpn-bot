// * Handler for "pay_bank" callback
import { setSession } from "../config/sessionStore.js";

// This handler is called when the user selects "کارت‌ به‌ کارت" (pay_bank)
const payBank = async (bot, query, session) => {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;

  // Edit the message to ask for the amount in Tomans, with instructions
  await bot.editMessageText(
    "💳 لطفاً مبلغ مورد نظر را به تومان و با کاما وارد کنید.\n\n───────────────\nحداقل: 50,000 تومان\nحداکثر: 500,000 تومان",
    {
      chat_id: chatId,
      message_id: messageId,
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
    }
  );

  // Set the session to indicate the user is entering a bank amount
  await setSession(chatId, {
    ...session,
    step: "waiting_for_bank_amount",
    messageId: messageId,
  });
};

export default payBank;
