const showPaymentStep = require("../services/showPaymentStep");
const handleTopUp = require("./message/handleTopUp");
const { deleteSession, getSession } = require("../config/sessionStore");
const keyboard = require("../keyboards/mainKeyboard");
const { CHOOSE_OPTION_MESSAGE } = require("../messages/staticMessages");
const storage = require("node-persist");

module.exports = async function handleCallbackQuery(bot, query) {
  const data = query.data;
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;

  if (data.startsWith("reply_")) {
    const targetUserId = data.split("_")[1];
    await storage.setItem("reply_target", targetUserId);
    await storage.setItem("original_support_message", query.message.text);

    const newText =
      "✏️ لطفاً پاسخ خود را تایپ کنید و سپس روی «ارسال پاسخ» بزنید.";
    const newMarkup = {
      reply_markup: {
        inline_keyboard: [
          [{ text: "✅ ارسال پاسخ", callback_data: "send_reply" }],
          [{ text: "❌ انصراف", callback_data: "cancel_reply" }],
        ],
      },
    };
    await bot.editMessageText(newText, {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: newMarkup.reply_markup,
    });
    await bot.answerCallbackQuery({ callback_query_id: query.id });

    return;
  }

  if (data === "canecl_reply") {
    const original_support_message = await storage.getItem(
      "original_support_message"
    );
    const targetUserId = await storage.getItem("reply_target");

    const newMarkup = {
      reply_markup: {
        inline_keyboard: [
          [{ text: "✏️ پاسخ", callback_data: `reply_${targetUserId}` }],
        ],

      }
    };
    await bot.editMessageText(original_support_message, {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: newMarkup.reply_markup,
    });

    await storage.removeItem("reply_target");
    await storage.removeItem("original_support_message");

    await bot.answerCallbackQuery({ callback_query_id: query.id });
    return;
  }

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
