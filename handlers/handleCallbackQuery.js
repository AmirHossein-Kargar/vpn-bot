import handleAddBalance from "./admin/handleAddBalance.js";
import showPaymentMethods from "./message/showPaymentMethods.js";
import { clearSession, getSession } from "../config/sessionStore.js";
import keyboard from "../keyboards/mainKeyboard.js";
import { CHOOSE_OPTION_MESSAGE } from "../messages/staticMessages.js";
import promptForReceipt from "../paymentHandlers/promptForReceipt.js";
import sendAdminPanels from "./admin/sendAdminPanels.js";
import { plans30, plans60, plans90 } from "../services/plans.js";
import handleBuyService from "../services/buyService/buyService.js";

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
      try {
        await bot.deleteMessage(chatId, messageId);
      } catch (error) {
        console.log("❗️خطا در حذف پیام اصلی:", error.message);
      }
      try {
        if (session?.supportMessageId) {
          await bot.deleteMessage(chatId, session.supportMessageId);
        }
      } catch (error) {
        console.log("❗️خطا در حذف پیام پشتیبانی:", error.message);
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
      await sendAdminPanels(bot, chatId, messageId);
      break;
    case "duration_30":
      await bot.editMessageText(
        "💡 لطفاً یکی از پلن‌های 30 روزه را انتخاب کنید:",
        {
          chat_id: chatId,
          message_id: messageId,
          ...generatePlanButtons(plans30),
        }
      );
      break;

    case "duration_60":
      await bot.editMessageText(
        "💡 لطفاً یکی از پلن‌های 60 روزه را انتخاب کنید:",
        {
          chat_id: chatId,
          message_id: messageId,
          ...generatePlanButtons(plans60),
        }
      );
      break;

    case "duration_90":
      await bot.editMessageText(
        "💡 لطفاً یکی از پلن‌های 90 روزه را انتخاب کنید:",
        {
          chat_id: chatId,
          message_id: messageId,
          ...generatePlanButtons(plans90),
        }
      );
      break;

    // * back to main menu when user choose "بازگشت" in buy-service menu
    case "buy_service_back_to_main":
      await bot.deleteMessage(chatId, messageId);
      await bot.sendMessage(chatId, CHOOSE_OPTION_MESSAGE);
      break;
    case "buy_service_back":
      await bot.deleteMessage(chatId, messageId);
      await handleBuyService(bot, chatId);
    // case "pay_ton":
    //   await showPaymentStep(bot, chatId, messageId, {
    //     stepKey: "waiting_for_ton_amount",
    //     message:
    //       "💠 لطفاً مبلغ مورد نظر را برای پرداخت با تون وارد کنید (بین 50,000 تا 500,000 تومان):",
    //   });
    //   break;
  }
};


const generatePlanButtons = (plans) => {
  const buttons = plans.map((plan) => [
    {
      text: `${plan.name} | ${plan.price.toLocaleString("en-US")} تومان`,
      callback_data: `plan_${plan.id}`,
    },
  ]);
  
  // * Add the "بازگشت" (Back) button at the end
  buttons.push([
    {
      text: "🔙 بازگشت",
      callback_data: "buy_service_back",
    },
  ]);
  
  return {
    reply_markup: {
      inline_keyboard: buttons,
    },
  };
};

  export default handleCallbackQuery;