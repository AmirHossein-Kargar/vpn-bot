import { getSession, setSession } from "../config/sessionStore.js";
import handleTonAmount from "../paymentHandlers/handleTonAmount.js";

const handleMessage = async (bot, msg) => {
  const chatId = msg.chat.id;
  const session = await getSession(chatId);
  const userText = msg.text;

  if (session?.step === "waiting_for_ton_amount") {
    return handleTonAmount(bot, msg);
  }
  if (msg.text === "🛠 پشتیبانی") {
    const userSupportMessageId = msg.message_id;
    await setSession(chatId, {
      supportMessageId: userSupportMessageId,
    });
  }
};

export default handleMessage;
