import { setSession } from "../config/sessionStore.js";

export default async function payTrx(bot, query, session) {
  const chatId = query?.message?.chat?.id || query?.from?.id;
  const messageId = session?.messageId || query?.message?.message_id;

  const backButton = [
    [
      {
        text: "🔙 بازگشت به روش‌های پرداخت",
        callback_data: "back_to_topup",
      },
    ],
  ];

  // Show amount input prompt
  try {
    await bot.editMessageText(
      `💸 <b>وارد کردن مبلغ واریز</b>

🔹 <b>لطفاً مبلغ مورد نظر را به تومان و با کاما وارد کنید.</b>
مثال: <code>50,000</code> | <code>120,000</code>

🔻 <b>محدودیت مبلغ:</b>
▫️ حداقل: <code>10,000 تومان</code>

✍️ <i>برای ادامه، مبلغ را به صورت صحیح ارسال کنید.</i>`,
      {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: backButton,
        },
      }
    );
  } catch (error) {
    console.error("Error editing message:", error.message);
  }

  // Set session to wait for TRX amount input
  await setSession(chatId, {
    ...session,
    step: "waiting_for_trx_amount",
    messageId: messageId,
    paymentType: "trx", // Add payment type to session
  });
}
