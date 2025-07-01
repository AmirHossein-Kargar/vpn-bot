const { getSession, setSession } = require("../config/sessionStore");
const handleTonAmount = require("../paymentHandlers/handleTonAmount");
const handleSupport = require("./message/handleSupport");

module.exports = async function handleMessage(bot, msg) {
  const chatId = msg.chat.id;
  const session = await getSession(chatId);

  if (session?.step === "waiting_for_ton_amount") {
    return handleTonAmount(bot, msg);
  }
  if (msg.text === "🛠 پشتیبانی") {
    const userSupportMessageId = msg.message_id;
    await setSession(chatId, {
      supportMessageId: userSupportMessageId,
    });
  await handleSupport(bot, chatId)
  }
};
