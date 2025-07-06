const validationAmount = require("../utils/validationAmount");
const { getSession, setSession } = require("../config/sessionStore");
const getTetherRate = require("../services/getTetherRate");
const createNowPaymentsInvoice = require("../services/nowpayments/createInvoice");
const getNowPaymentsEstimate = require("../services/nowpayments/getNowPaymentsEstimate");
const buildPaymentInvoice = require("../utils/buildPaymentInvoice");

module.exports = async function handleTonAmount(bot, msg) {
  // * Extract the chat ID from the message
  const chatId = msg.chat.id;
  // * Remove any leading/trailing whitespace
  const text = msg.text.trim();

  // * Delete the user's message to keep the chat clean
  await bot.deleteMessage(chatId, msg.message_id).catch(() => {});

  const session = await getSession(chatId);

  const botMessageId = session?.messageId;

  // * If there's no message ID in the session, exit the function
  if (!botMessageId) return;

  // * Validate the amount entered by the user
  const { valid, amount, message } = validationAmount(text);

  // * If validation fails, send an error message and a button to return to the payment methodes
  if (!valid) {
    return bot.editMessageText(message, {
      chat_id: chatId,
      message_id: botMessageId,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🔙 بازگشت به روش‌های پرداخت",
              callback_data: "back_to_topup",
            },
          ],
        ],
      },
    });
  }

  // * If amount is valid, show success message with formatted amount
  await bot.editMessageText(
    `✅ مبلغ ${amount.toLocaleString()} تومان ثبت شد و فاکتور در حال ساخت است.`,
    {
      chat_id: chatId,
      message_id: botMessageId,
    }
  );

  const tetherPrice = await getTetherRate();
  const usdAmount = amount / tetherPrice;
  const realTonAmount = await getNowPaymentsEstimate({
    amount: usdAmount,
    currency_from: "usd",
    currency_to: "ton",
  });

  // console.log(`💸 Amount saved: ${amount} Toman`);
  // console.log(`💵 Equivalent in USD: $${usdAmount.toFixed(2)}`);

  const invoice = await createNowPaymentsInvoice({
    amountUsd: usdAmount,
    payCurrency: "ton",
    orderId: `ton-topup-${chatId}`,
    description: `Top-up for user ${chatId}`,
  });
  console.dir(invoice, { depth: null });

  await setSession(chatId, {
    ton_payment: {
      amount,
      usdAmount,
      tonAmount: realTonAmount,
      tetherPrice,
      invoiceUrl: invoice.invoice_url,
    },
  });

  setTimeout(async () => {
    const invoiceText = buildPaymentInvoice({
      amount: amount,
      usdAmount: usdAmount,
      cryptoAmtNum: Number(realTonAmount),
      cryptoSymbol: "TON",
      invoiceUrl: invoice.invoice_url,
      invoiceId: invoice.id,
    });

    await bot.editMessageText(invoiceText, {
      chat_id: chatId,
      message_id: botMessageId,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "💳 Pay with TON",
              url: invoice.invoice_url,
            },
          ],
          [
            {
              text: "🔙 Back to Home",
              callback_data: "back_to_home",
            },
          ],
        ],
      },
    });
  }, 1000);
};
