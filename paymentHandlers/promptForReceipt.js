import { setSession } from "../config/sessionStore.js";

const promptForReceipt = async (bot, chatId, session) => {
  await bot.editMessageText("💳 لطفاً رسید واریزی خود را ارسال کنید.", {
    chat_id: chatId,
    message_id: session.messageId,
  });
  await setSession(chatId, {
    ...session,
    step: "waiting_for_receipt_image",
  });
};
export default promptForReceipt