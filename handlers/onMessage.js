const { getSession, setSession } = require("../config/sessionStore");
const handleBankTransferAccount = require("../paymentHandlers/handleBankTransferAccount");
const handleTonAmount = require("../paymentHandlers/handleTonAmount");

module.exports = async function handleMessage(bot, msg) {
  const chatId = msg.chat.id;
  const session = await getSession(chatId);
  const userText = msg.text;

  if (session?.step === "waiting_for_ton_amount") {
    return handleTonAmount(bot, msg);
  }
  if(session?.paymentStep === "awaiting_bank_amount") {
    await handleBankTransferAccount(bot, msg)
    await setSession(chatId, {...session, paymentStep: null})
    return
  }
  if (msg.text === "🛠 پشتیبانی") {
    const userSupportMessageId = msg.message_id;
    await setSession(chatId, {
      supportMessageId: userSupportMessageId,
    });
  }
};
