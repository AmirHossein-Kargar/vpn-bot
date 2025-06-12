const plans = require("./plans");

function handleBuyService(bot, chatId) {
  const message = `🛒 در 2 مرحله سرویس اختصاصی بگیرید ..

🔻 یکی از پلن‌های موجود را انتخاب کنید :`;

  const inlineKeyboard = plans.map((plan) => {
    return [
      {
        text: `${plan.name} - ${plan.price.toLocaleString()} تومان`,
        callback_data: `plan_${id}`,
      },
    ];
  });

  bot.sendMessage(chatId, message, {
    reply_markup: {
      inline_keyboard: inlineKeyboard,
    },
  });
}

module.exports = handleBuyService;
