import { setSession } from "../config/sessionStore.js";
import invoice from "../models/invoice.js";
import User from "../models/User.js";

const handleBankRecipt = async (bot, msg, session) => {
  const chatId = msg.chat.id;
  const fileId = msg.photo[msg.photo.length - 1].file_id;
  const user = msg.from;
  const groupId = process.env.GROUP_ID;

  const phoneNumber =
    (await User.findOne({ telegramId: user.id })?.phoneNumber) || "نامشخص";

  // * 1. Find the invoice by paymentId and update status to "waiting_for_approval"
  if (session.paymentId) {
    try {
      await invoice.findOneAndUpdate(
        { paymentId: session.paymentId },
        { status: "waiting_for_approval" }
      );
    } catch (error) {
      console.error("Error updating invoice status:", error.message);
    }
  }

  const RLM = "\u200F"; // Right-to-Left Mark

  await bot.sendPhoto(groupId, fileId, {
    caption:
      `🧾 <b>رسید جدید پرداخت</b>\n\n` +
      `👤 <b>نام کاربر:</b> <code>${user.first_name || "نامشخص"}</code>\n` +
      ` <b>آیدی عددی:</b> <code>${RLM}${user.id}</code>\n` +
      `📎 <b>یوزرنیم:</b> @${user.username || "ندارد"}\n` +
      `📞 <b>شماره تلفن:</b> <code>${phoneNumber}</code>\n` +
      `💰 <b>مبلغ:</b> <code>${session.rawAmount.toLocaleString(
        "en-US"
      )} تومان</code>\n` +
      `📌 <b>شماره فاکتور:</b> <code>${
        session.paymentId ? RLM + session.paymentId : "نامشخص"
      }</code>`,
    parse_mode: "HTML",
  });

  // * 3. Delete the user's photo message
  await bot.deleteMessage(chatId, msg.message_id);

  // * 4. Update session to reflect receipt sent
  await setSession(chatId, {
    ...session,
    step: "recipt_sent",
  });

  // * 5. Edit the previous message to notify the user
  await bot.editMessageText(
    "✅ رسید شما با موفقیت ارسال شد. منتظر تأیید توسط ادمین باشید.",
    {
      chat_id: chatId,
      message_id: session.messageId,
    }
  );
};

export default handleBankRecipt;
