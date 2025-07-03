// * 🗂️ Models
const User = require("../models/User");
const keyboard = require("../keyboards/mainKeyboard");
const handleProfile = require("./message/handleProfile");

async function handleContact(bot, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const phoneNumber = msg.contact.phone_number;

  let user = await User.findOne({ telegramId: userId });

  if (!user) {
    await User.create({
      telegramId: userId,
      balance: 0,
      successfulPayments: 0,
      totalServices: 0,
      phoneNumber: phoneNumber,
    });
    await bot.sendMessage(
      chatId,
      "✅ حساب شما با شماره تلفن ثبت شد.",
      keyboard
    );
  } else if (!user.phoneNumber) {
    user.phoneNumber = phoneNumber;
    await user.save();
    await bot.sendMessage(
      chatId,
      "✅ شماره تلفن شما با موفقیت به‌روزرسانی شد.",
      keyboard
    );
  } else {
    await bot.sendMessage(
      chatId,
      "ℹ️ شماره تلفن شما قبلاً ثبت شده است.",
      keyboard
    );
  }

  await handleProfile(bot, chatId, userId);
}

module.exports = handleContact;
