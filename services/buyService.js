import plans from "./plans.js";

// * This function handles the "Buy Service" feature.
// * It sends a message with a list of available plans,
// * each shown as an inline button the user can tap to select.

const handleBuyService = async (bot, chatId) => {
  const message = `🛒 در 2 مرحله سرویس اختصاصی بگیرید ..

🔻 ابتدا مدت زمان سرویس را انتخاب کنید:`;

  const durationButtons = {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🔹 30 روزه", callback_data: "duration_30" }],
        [{ text: "🔸 60 روزه", callback_data: "duration_60" }],
        [{ text: "🔷 90 روزه", callback_data: "duration_90" }],
      ],
    },
  };

  await bot.sendMessage(chatId, message, durationButtons);
}

export default handleBuyService;
