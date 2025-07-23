import { setSession } from "../config/sessionStore.js";
import invoice from "../models/invoice.js";

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

  // * 2. Send receipt photo to admin group
  await bot.sendPhoto(groupId, fileId, {
    caption: `🧾 رسید جدید پرداخت

    👤 نام کاربر: ${user.first_name || "نامشخص"}
    🆔 آیدی عددی: ${user.id}
    📎 یوزرنیم: @${user.username || "ندارد"}
    💰 مبلغ: ${session.rawAmount} تومان
    🔖 شماره فاکتور: ${session.paymentId || "نامشخص"}`,
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
