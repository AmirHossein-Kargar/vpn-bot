module.exports = async function handleCallbackQuery(bot, query) {
  const data = query.data;

  if (data === "pay_bank") {
    return bot.answerCallbackQuery({
      callback_query_id: query.id,
      text: "❌ امکان کارت‌ به‌ کارت در حال حاضر وجود ندارد.",
      show_alert: false,
    });
  }
};
