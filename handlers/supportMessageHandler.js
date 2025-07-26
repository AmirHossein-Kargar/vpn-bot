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

  const userInfo =
  `👤 کاربر: ${msg.from.first_name || "نامشخص"}\n` +
  `🔗 یوزرنیم: @${msg.from.username || "ندارد"}\n` +
  `🆔 آیدی عددی: <code>${userId}</code>` +
  (user?.balance !== undefined
    ? `\n💰 موجودی: <code>${user.balance.toLocaleString()}</code> تومان`
    : "");

await bot.sendMessage(
  groupId,
  `📩 <b>پیام جدید پشتیبانی</b>\n\n${userInfo}\n\n📝 <b>متن پیام:</b>\n${text}`,
  { parse_mode: "HTML" }
);

  await bot.sendMessage(
    chatId,
    "✅ پیام شما با موفقیت برای پشتیبانی ارسال شد",
    keyboard
  );

  // * CLEAR THE SUPPORT SESSION
  session.support = false;
  session.supportMessageId = null;
  await setSession(userId, session);
};

export default supportMessageHandler;
