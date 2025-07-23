import handleAddBalance from "./admin/handleAddBalance.js";
import showPaymentMethods from "./message/showPaymentMethods.js";
import {
  clearSession,
  getSession,
  setSession,
} from "../config/sessionStore.js";
import keyboard from "../keyboards/mainKeyboard.js";
import { CHOOSE_OPTION_MESSAGE } from "../messages/staticMessages.js";
import promptForReceipt from "../paymentHandlers/promptForReceipt.js";
import sendAdminPanels from "./admin/sendAdminPanels.js";

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
      await promptForReceipt(bot, chatId, session);
      break;
    case "admin_add_balance":
      await handleAddBalance(bot, query, session);
      break;
    case "admin_back_to_main":
      // await bot.deleteMessage(chatId, messageId)
      await sendAdminPanels(bot, chatId, messageId);
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
