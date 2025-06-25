const validationAmount = require("../utils/validationAmount");
module.exports = async function handleTonAmount(bot, msg) {
  const text = msg.text.trim();
  const chatId = msg.chat.id;

  const { valid, amount, message } = validationAmount(text, 50000, 5000000);

  if (!valid) {
    return bot.sendMessage(chatId, message);
  }

  await bot.sendMessage(
    chatId,
    `✅ مبلغ ${amount.toLocaleString()} تومان ثبت شد و فاکتور در حال ساخت است.`
  );
};
