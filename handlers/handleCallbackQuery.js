import showPaymentStep from "../services/showPaymentStep.js";
import showPaymentMethods from "./message/showPaymentMethods.js";
import {
  clearSession,
  getSession,
  setSession,
} from "../config/sessionStore.js";
import keyboard from "../keyboards/mainKeyboard.js";
import { CHOOSE_OPTION_MESSAGE } from "../messages/staticMessages.js";

const handleCallbackQuery = async (bot, query) => {
  const data = query.data;
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;

  const session = await getSession(chatId);

  switch (data) {
    case "back_to_topup":
      await bot.deleteMessage(chatId, messageId);
      await clearSession(chatId); // * Clear session
      await showPaymentMethods(bot, chatId);
      break;

    case "back_to_home":
      await bot.deleteMessage(chatId, messageId);
      if (session?.supportMessageId) {
        await bot.deleteMessage(chatId, session.supportMessageId);
      }
      await clearSession(chatId);
      await bot.sendMessage(chatId, CHOOSE_OPTION_MESSAGE, keyboard);
      break;

    case "pay_bank":
      await bot.answerCallbackQuery({ callback_query_id: query.id });

      if (session?.messageId) {
        await bot.deleteMessage(chatId, session.messageId).catch(() => {});
      }

      const sentMsg = await bot.sendMessage(
        chatId,
        "💠 لطفاً مبلغ مورد نظر را برای پرداخت کارت به کارت وارد کنید (بین 50,000 تا 500,000 تومان):"
      );
      await setSession(chatId, {
        ...session,
        step: "payment_bank_amount",
        messageId: sentMsg.message_id,
      });
      break;

    // case "pay_ton":
    //   await showPaymentStep(bot, chatId, messageId, {
    //     stepKey: "waiting_for_ton_amount",
    //     message:
    //       "💠 لطفاً مبلغ مورد نظر را برای پرداخت با تون وارد کنید (بین 50,000 تا 500,000 تومان):",
    //   });
    //   break;
  }
};

export default handleCallbackQuery;
