import { setSession } from "../config/sessionStore.js";
import validateWithCommas from "../utils/validationAmount.js";
import invoice from "../models/invoice.js";

const payBank = async (bot, msg, session) => {
  const chatId = msg?.chat?.id || msg?.from?.id;
  const text = msg?.text?.trim();
  const messageId = session?.messageId || msg?.message_id;

  const backButton = [
    [
      {
        text: "🔙 بازگشت به روش‌های پرداخت",
        callback_data: "back_to_topup",
      },
    ],
  ];

  if (!text) {
    try {
      await bot.editMessageText(
        `💸 <b>وارد کردن مبلغ واریز</b>


🔹 <b>لطفاً مبلغ مورد نظر را به تومان و با کاما وارد کنید.</b>
مثال: <code>50,000</code> | <code>120,000</code>

🔻 <b>محدودیت مبلغ:</b>
▫️ حداقل: <code>10,000 تومان</code>
▫️ حداکثر: <code>500,000 تومان</code>

✍️ <i>برای ادامه، مبلغ را به صورت صحیح ارسال کنید.</i>
        `,
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
      console.error("Error editting message", error.message);
    }

    await setSession(chatId, {
      ...session,
      step: "waiting_for_bank_amount",
      messageId: messageId,
    });

    return;
  }

  const validation = validateWithCommas(text);

  await bot.deleteMessage(chatId, msg.message_id).catch(() => {});

  if (!validation.valid) {
    try {
      await bot.editMessageText(validation.message, {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: {
          inline_keyboard: backButton,
        },
      });
    } catch (error) {
      if (
        !error?.response?.body?.description?.includes(
          "message is not modified"
        ) &&
        !error?.response?.body?.description?.includes(
          "message to edit not found"
        )
      ) {
        console.error("Error editting message", error.message);
      }
    }

    await setSession(chatId, {
      ...session,
      messageId: messageId,
    });

    return;
  }

  const paymentId = Math.random().toString(36).substr(2, 8).toUpperCase();
  const CARD_NUMBER = process.env.CARD_NUMBER;
  const ltrCardNumber = `\u200E${CARD_NUMBER}`;

  // Generate a unique payment ID (شناسه پرداخت)
  // Save paymentId to session for later verification if needed

  // Compose the confirmation text with payment ID
  const rtl = (s) => `\u202B${s}\u202C`;
  const ltr = (s) => `\u202A${s}\u202C`;

  const confirmationText =
    rtl("🧾 فاکتور پرداخت") +
    "\n" +
    rtl(`🔖 شماره فاکتور: <code>${ltr(paymentId)}</code>`) +
    "\n\n" +
    rtl(`💳 مبلغ: <code>${text}</code> تومان را به شماره کارت زیر واریز کنید:`) +
    "\n\n" +
    `🔢 شماره کارت: <code>${ltr(ltrCardNumber)}</code>\n\n` +
    rtl("سپس روی دکمه زیر کلیک کرده و رسید واریزی را ارسال نمایید.");

  // * save invoice to database
  try {
    await invoice.create({
      paymentId,
      userId: chatId,
      amount: Number(validation.amount) || 0,
    });
  } catch (error) {
    console.error("Error to save invoice", error.message);
  }

  // Set a timeout to edit the message after 2 minutes (120000 ms)
  // setTimeout(async () => {
  //   try {
  //     await bot.editMessageText(
  //       "⏰ مهلت پرداخت تموم شد. لطفاً دوباره تلاش کنید.",
  //       {
  //         chat_id: chatId,
  //         message_id: messageId,
  //         parse_mode: "HTML",
  //         reply_markup: {
  //           inline_keyboard: [
  //             [
  //               {
  //                 text: "🔙 بازگشت به روش‌ های پرداخت",
  //                 callback_data: "back_to_topup",
  //               },
  //             ],
  //           ],
  //         },
  //       }
  //     );
  //   } catch (error) {}
  // }, 120000);

  try {
    await bot.editMessageText(confirmationText, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "📤 ارسال رسید واریزی", callback_data: "upload_receipt" }],
          [
            {
              text: "❌ کنسل کردن پرداخت و بازگشت",
              callback_data: "back_to_topup",
            },
          ],
        ],
      },
    });
  } catch (error) {
    console.error("Error editting message", error.message);
  }

  await setSession(chatId, {
    ...session,
    paymentId,
    step: "waiting_for_receipt_image",
    rawAmount: text,
    messageId,
  });
};

export default payBank;
