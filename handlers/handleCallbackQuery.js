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
      const payBank = (await import("./../paymentHandlers/payBank.js")).default;
      await payBank(bot, query, session);
      break;

    case "upload_receipt":
      await bot.editMessageText(
        "💳 لطفاً رسید واریزی خود را ارسال کنید.",
        {
          chat_id: chatId,
          message_id: session.messageId,
        }
      );
      await setSession(chatId, {
        ...session,
        step: "waiting_for_receipt_image",
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
