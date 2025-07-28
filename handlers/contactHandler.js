// * 🗂️ Models
import User from "../models/User.js";
import keyboard from "../keyboards/mainKeyboard.js";
import handleProfile from "./message/handleProfile.js";

const handleContact = async (bot, msg, afterVerify) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  // If the message does not contain a contact, prompt the user to share their phone number
  if (!msg.contact) {
    const requestContactKeyboard = {
      reply_markup: {
        keyboard: [
          [
            {
              text: "📞 ارسال شماره من",
              request_contact: true,
            },
          ],
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    };
    await bot.sendMessage(
      chatId,
      "📞 لطفاً شماره تلفن خود را ارسال کنید:",
      requestContactKeyboard
    );
    return;
  }

  const phoneNumber = msg.contact.phone_number;

  let user = await User.findOne({ telegramId: userId });

  if (!user) {
    await User.create({
      firstName: msg.from.first_name,
      lastName: msg.from.last_name,
      username: msg.from.username,
      telegramId: userId,
      balance: 0,
      successfulPayments: 0,
      totalServices: 0,
      phoneNumber: phoneNumber,
    });
    await bot.sendMessage(
      chatId,
      "✅ احراز هویت شما با موفقیت انجام شد",
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
    if (afterVerify) {
      await afterVerify();
    } else {
      await handleProfile(bot, chatId, userId);
    }
    return;
  }
};

export default handleContact;
