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

  if (session?.step === "waiting_for_config_details") {
    await handleSendConfig(bot, msg, session);
  }
};

// Handle sending config to user
const handleSendConfig = async (bot, msg, session) => {
  const chatId = msg.chat.id;
  const configText = msg.text;
  const targetUserId = session.targetUserId;

  if (!targetUserId) {
    await bot.sendMessage(chatId, "❌ خطا: کاربر مورد نظر یافت نشد.");
    return;
  }

  try {
    // Send config to the target user
    await bot.sendMessage(targetUserId, configText);
    
    // Confirm to admin
    await bot.sendMessage(chatId, "✅ کانفیگ با موفقیت به کاربر ارسال شد.");
    
    // Clear session
    await setSession(chatId, { step: null });
    
  } catch (error) {
    console.error("Error sending config to user:", error);
    await bot.sendMessage(chatId, "❌ خطا در ارسال کانفیگ به کاربر.");
  }
};
export default handleMessage;
