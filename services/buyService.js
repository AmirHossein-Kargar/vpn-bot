import plans from "./plans.js";

// * This function handles the "Buy Service" feature.
// * It sends a message with a list of available plans,
// * each shown as an inline button the user can tap to select.

const handleBuyService = async (bot, chatId) => {
  // * Define the introductory message
  const message = `🛒 در 2 مرحله سرویس اختصاصی بگیرید ..

🔻 یکی از پلن‌های موجود را انتخاب کنید :`;

  const inlineKeyboard = plans.map((plan) => {
    return [
      {
        // * Combine the plan name and price into a readable format
        text: `${plan.name} - ${plan.price.toLocaleString()} تومان`,
        // * Set a unique identifier for each button to handle later
        callback_data: `plan_${plan.id}`,
      },
    ];
  });

  // * Send the mssage and the inline keyboard to the user
  bot.sendMessage(chatId, message, {
    reply_markup: {
      inline_keyboard: inlineKeyboard,
    },
  });
};

export default handleBuyService;
