const showPaymentStep = require("../services/showPaymentStep");
const handleTopUp = require("./message/handleTopUp");
const { deleteSession, getSession } = require("../config/sessionStore");
const keyboard = require("../keyboards/mainKeyboard");
const { CHOOSE_OPTION_MESSAGE } = require("../messages/staticMessages");

module.exports = async function handleCallbackQuery(bot, query) {
  const data = query.data;
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;

  switch (data) {
    case "back_to_topup":
      await bot.deleteMessage(chatId, messageId);
      deleteSession(chatId); // * Clear session
      await handleTopUp(bot, chatId);
      break;

    case "back_to_home":
      await bot.deleteMessage(chatId, messageId);
      const session = await getSession(chatId);
      if (session?.supportMessageId) {
        await bot.deleteMessage(chatId, session.supportMessageId);
      }
      await deleteSession(chatId);
      await bot.sendMessage(chatId, CHOOSE_OPTION_MESSAGE, keyboard);
      break;

    case "pay_bank":
      await bot.answerCallbackQuery({
        callback_query_id: query.id,
        text: "❌ امکان کارت‌ به‌ کارت در حال حاضر وجود ندارد.",
        show_alert: false,
      });
      break;

    case "pay_ton":
      await showPaymentStep(bot, chatId, messageId, {
        stepKey: "waiting_for_ton_amount",
        message:
          "💠 لطفاً مبلغ مورد نظر را برای پرداخت با تون وارد کنید (بین 50,000 تا 500,000 تومان):",
      });
      break;
  }
};
