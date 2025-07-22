import { getSession, setSession } from "../config/sessionStore.js";
import handleTonAmount from "../paymentHandlers/handleTonAmount.js";
import payBank from "../paymentHandlers/payBank.js";

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

  if (session?.step === "waiting_for_bank_amount" && msg.text) {
    await payBank(bot, msg, session);
  }
};

export default handleMessage;
