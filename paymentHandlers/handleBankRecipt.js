import { setSession } from "../config/sessionStore.js";
import invoice from "../models/invoice.js";
import User from "../models/User.js";

const handleBankRecipt = async (bot, msg, session) => {
  const chatId = msg.chat.id;
  const fileId = msg.photo[msg.photo.length - 1].file_id;
  const user = msg.from;
  const groupId = process.env.GROUP_ID;

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

  // Fetch phoneNumber from DB
  const dbUser = await User.findOne({ telegramId: user.id });
  const phoneNumber =
    dbUser && dbUser.phoneNumber ? dbUser.phoneNumber : "نامشخص";
  // Remove +98 from phoneNumber if present
  const displayPhoneNumber = phoneNumber.startsWith("+98")
    ? phoneNumber.replace("+98", "0")
    : phoneNumber;

  const RLM = "\u200F"; // Right-To-Left Mark
  const LTR = "\u202A"; // Left-To-Right Embedding
  const PDF = "\u202C"; // Pop Directional Formatting

  await bot.sendPhoto(groupId, fileId, {
    caption:
      `🧾 <b>رسید جدید پرداخت</b>\n\n` +
      `👤 <b>نام کاربر:</b> <code>${user.first_name || "نامشخص"}</code>\n` +
      `<b>آیدی عددی:</b> <code>${LTR}${user.id}${PDF}</code>\n` +
      `📎 <b>یوزرنیم:</b> @${user.username || "ندارد"}\n` +
      `📞 <b>شماره تلفن:</b> <code>${displayPhoneNumber}</code>\n` +
      `💰 <b>مبلغ:</b> <code>${session.rawAmount.toLocaleString(
        "en-US"
      )} تومان</code>\n` +
      `📌 <b>شماره فاکتور:</b> <code>${
        session.paymentId ? `${LTR}${session.paymentId}${PDF}` : "نامشخص"
      }</code>`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "✅ تایید",
            callback_data: `confirm_payment_${user.id}_${session.rawAmount}_${session.paymentId}`,
          },
          {
            text: "❌ رد",
            callback_data: `reject_payment_${session.paymentId}_${user.id}`,
          },
        ],
      ],
    },
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
