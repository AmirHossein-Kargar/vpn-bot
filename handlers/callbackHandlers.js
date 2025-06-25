const showPaymentStep = require("../showPaymentStep");
const sessions = require("../sessions");
const handleTopUp = require("../handleTopUp");

module.exports = async function handleCallbackQuery(bot, query) {
  const data = query.data;
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;

  // * back to payment options
  if (data === "back_to_topup") {
    await bot.deleteMessage(chatId, messageId);
    sessions[chatId] = null;
    return handleTopUp(bot, chatId);
  }

  if (data === "pay_bank") {
    return bot.answerCallbackQuery({
      callback_query_id: query.id,
      text: "❌ امکان کارت‌ به‌ کارت در حال حاضر وجود ندارد.",
      show_alert: false,
    });
  }

  if (data === "pay_ton") {
    return showPaymentStep(bot, chatId, messageId, {
      stepKey: "waiting_for_ton_amount",
      message:
        "💠 لطفاً مبلغ مورد نظر را برای پرداخت با تون وارد کنید (بین ۵۰,۰۰۰ تا ۵,۰۰۰,۰۰۰ تومان):",
    });
  }
  
};
