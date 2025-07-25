import { getSession, setSession } from "../config/sessionStore.js";
import User from "../models/User.js";
import keyboard from "../keyboards/mainKeyboard.js";

const supportMessageHandler = async (bot, msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;
  const session = await getSession(userId);
  if (!session?.support) return;

  // * GET USER INFO
  const user = await User.findOne({ telegramId: String(userId) });
  const groupId = process.env.GROUP_ID;

  let userInfo = `👤 کاربر: ${msg.from.first_name || "نامشخص"} (@${
    msg.from.username || "ندارد"
  })\n🆔 آیدی عددی: ${userId}`;
  // if (user && user.phoneNumber) userInfo += `\n📞 تلفن: ${user.phoneNumber}`;
  if (user && user.balance !== undefined)
    userInfo += `\n💰 موجودی: ${user.balance}`;

  // * FORWARD THE SUPPORT MESSAGE TO THE ADMIN GROUP
  await bot.sendMessage(
    groupId,
    `📩 پیام پشتیبانی جدید:\n${userInfo}\n\nپیام:\n${text}`
  );

  await bot.sendMessage(chatId, "✅ پیام شما با موفقیت برای پشتیبانی ارسال شد", keyboard);

  // * CLEAR THE SUPPORT SESSION
  session.support = false;
  session.supportMessageId = null;
  await setSession(userId, session);
};

export default supportMessageHandler;
