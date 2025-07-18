import { setSession } from "../config/sessionStore.js";

const startPaymentProcess = async (bot, chatId, session, messageText) => {
  if (session?.messageId) {
    await bot.editMessageText(messageText, {
      chat_id: chatId,
      message_id: session.messageId,
    });
  } else {
    const sentMsg = await bot.sendMessage(chatId, messageText);
    await setSession(chatId, { ...session, messageId: sentMsg.message_id });
  }
};

export default startPaymentProcess;
