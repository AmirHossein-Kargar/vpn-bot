import handleAddBalance from "./admin/handleAddBalance.js";
import showPaymentMethods from "./message/showPaymentMethods.js";
import { clearSession, getSession } from "../config/sessionStore.js";
import keyboard from "../keyboards/mainKeyboard.js";
import { CHOOSE_OPTION_MESSAGE } from "../messages/staticMessages.js";
import promptForReceipt from "../paymentHandlers/promptForReceipt.js";
import sendAdminPanels from "./admin/sendAdminPanels.js";
import plans, { plans30, plans60, plans90 } from "../services/plans.js";
import handleBuyService from "../services/buyService/buyService.js";
import generatePlanButtons from "../keyboards/generatePlanButtons.js";
import confirmOrder from "../services/buyService/confirmOrder.js";
import orderService from "../services/buyService/orderService.js";

const handleCallbackQuery = async (bot, query) => {
  const data = query.data;
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;
  const userId = query.from.id;
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
      break
  
    // case "pay_ton":
    //   await showPaymentStep(bot, chatId, messageId, {
    //     stepKey: "waiting_for_ton_amount",
    //     message:
    //       "💠 لطفاً مبلغ مورد نظر را برای پرداخت با تون وارد کنید (بین 50,000 تا 500,000 تومان):",
    //   });
    //   break;
  }
  if (data.startsWith("plan_")) {
    const planId = data.replace("plan_", "");
  
    const allPlans = [...plans30, ...plans60, ...plans90];
    const selectedPlan = allPlans.find((plan) => plan.id === planId);
  
    if (!selectedPlan) {
      await bot.sendMessage(chatId, "❌ پلن مورد نظر یافت نشد.");
      return;
    }
  
    const { message, replyMarkup } = confirmOrder(selectedPlan);
  
    await bot.editMessageText(message, {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: replyMarkup,
      parse_mode: "HTML",
    });
  
    return;
  }
  if (data.startsWith("confirm_order_")) {
    const planId = data.split("confirm_order_")[1];
    const allPlans = [...plans30, ...plans60, ...plans90];
    const selectedPlan = allPlans.find((p) => p.id.toString() === planId);

    if (!selectedPlan) {
      return bot.sendMessage(chatId, "❌ پلن مورد نظر یافت نشد.");
    }
    await bot.deleteMessage(chatId, messageId);
    await orderService(bot, chatId, userId, selectedPlan);
    return;
  }
};


export default handleCallbackQuery;