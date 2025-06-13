const User = require("./models/User");
const moment = require("moment-jalaali");

module.exports = async function handleProfile(bot, chatId, userId) {
try {
    let user = await User.findOne({ telegramId: userId });
  if (!user) {
    user = await User.create({ telegramId: userId });
  }

  const formattedDate = moment(user.createdAt).format("jYYYY/jM/jD");

  const message = `👤 شناسه کاربری: ${user.telegramId}
    
💰 موجودی: ${user.balance.toLocaleString()} تومان
🟢 پرداخت های موفق: ${user.successfulPayments} عدد
📦 کل سرویس ها: ${user.totalServices} عدد
📞 شماره تلفن: ${user.phoneNumber || "ثبت نشده"}
🕒 تاریخ عضویت: ${formattedDate}`;

bot.sendMessage(chatId, message)
    
} catch (err) {
    bot.sendMessage(chatId, "❌ خطایی رخ داده است. لطفاً دوباره تلاش کنید.")
}
};
