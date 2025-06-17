// spell-checker: disable
// Disable unknown word warning for moment-jalaali
const moment = require("moment-jalaali");
const User = require("./models/User");


moment.loadPersian({ usePersianDigits: false, dialect: "persian-modern" });

module.exports = async function handleProfile(bot, chatId, userId) {
  try {
    let user = await User.findOne({ telegramId: userId });

    const phone = user?.phoneNumber?.startsWith("+98")
      ? user.phoneNumber.replace("+98", "0")
      : user?.phoneNumber || "ثبت نشده";

    const formattedDate = moment(user.createdAt).format("jYYYY/jM/jD");

    const message = `👤 شناسه کاربری: ${user.telegramId}
    
💰 موجودی: ${user.balance.toLocaleString()} تومان
🟢 پرداخت های موفق: ${user.successfulPayments} عدد
📦 کل سرویس ها: ${user.totalServices} عدد
📞 شماره تلفن: ${phone}
🕒 تاریخ عضویت: ${formattedDate}`;

    bot.sendMessage(chatId, message);
  } catch (err) {
    bot.sendMessage(chatId, "❌ خطایی رخ داده است. لطفاً دوباره تلاش کنید.");
  }
};
