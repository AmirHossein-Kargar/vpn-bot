const { setSession } = require("../config/sessionStore");
const validationAmount = require("../utils/validationAmount");

module.exports = async function handleBankTransferAccount(bot, msg) {
  const chatId = msg.chat.id;
  const text = msg.text.trim();

  await bot.deletMessage(chatId, msg.message_id).catch(() => {});

  const session = getSession(chatId);

  const { valid, amount, message } = validationAmount(text);

  if (!valid) {
    bot.sendMessage(chatId, message);
    return;
  }

  await setSession(chatId, { ...session, bankTransferAmount: amount });

  const cardNumber = `6219 8619 1243 3264`

  await bot.sendMessage(chatId, `💳 شماره کارت برای واریز:\n\`${cardNumber}\``, {
  parse_mode: "MarkdownV2",
});

};
