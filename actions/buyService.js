// handleBuyService.js
const plans = require("./plans");

function handleBuyService(bot, chatId) {
  const message = `🛒 در 2 مرحله سرویس اختصاصی بگیرید ..

🔻 یکی از پلن‌های موجود را انتخاب کنید:`;

  const inlineKeyboard = plans.map((plan) => [
    {
      text: plan.name,
      callback_data: `buy_${plan.id}`,
    },
  ]);

  bot.sendMessage(chatId, message, {
    reply_markup: {
      inline_keyboard: inlineKeyboard,
    },
  });
}

module.exports = handleBuyService;
