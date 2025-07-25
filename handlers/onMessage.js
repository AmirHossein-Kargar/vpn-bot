import { getSession, setSession } from "../config/sessionStore.js";
import handleTonAmount from "../paymentHandlers/handleTonAmount.js";
import payBank from "../paymentHandlers/payBank.js";
import handleAddBalance from "./admin/handleAddBalance.js";
import supportMessageHandler from "./supportMessageHandler.js";

const handleMessage = async (bot, msg) => {
  const chatId = msg.chat.id;
  const session = await getSession(chatId);

  // Forward support messages if in support mode
  if (session?.support) {
    await supportMessageHandler(bot, msg);
    return;
  }

  const userText = msg.text;

  if (session?.step === "waiting_for_ton_amount") {
    return handleTonAmount(bot, msg);
  }
 
  if (session?.step === "waiting_for_bank_amount" && msg.text) {
    await payBank(bot, msg, session);
  }

  if (
    session?.step === "waiting_for_user_id" ||
    session?.step === "waiting_for_amount"
  ) {
    await handleAddBalance(bot, msg, session);
  }
};
export default handleMessage;
