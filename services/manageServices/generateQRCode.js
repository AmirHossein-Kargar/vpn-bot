import { findService } from "../api/wizardApi.js";
import User from "../models/User.js";

const generateQRCode = async (bot, chatId, messageId, data, query = {}) => {
  // data is expected to be like "qrcode_USERNAME"
  const username = data.split("qrcode_")[1];
  const userId = query.from?.id;

  // If userId is not provided, try to get from query or skip user check
  let user;
  if (userId) {
    user = await User.findOne({ telegramId: userId });
    if (!user) {
      await bot.answerCallbackQuery(query.id, {
        text: "کاربر پیدا نشد.",
        show_alert: true,
      });
      return;
    }
    const service = user.services.find((s) => s.username === username);
    if (!service) {
      await bot.answerCallbackQuery(query.id, {
        text: "سرویس پیدا نشد.",
        show_alert: true,
      });
      return;
    }
  }

  // Generate QR code URL using the subscription link
  // To add margin (padding) around the QR code, you can use the "margin" parameter (in pixels) supported by api.qrserver.com:
  const subLink = await findService(username);
  if (!subLink?.result?.hash) {
    await bot.answerCallbackQuery(query.id, {
      text: "خطا در دریافت لینک سرویس.",
      show_alert: true,
    });
    return;
  }
  const iranisystemUrl = `https://iranisystem.com/bot/sub/?hash=${subLink.result.hash}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
    iranisystemUrl
  )}&size=200x200&margin=20`; // 20px margin around the QR code

  try {
    await bot.editMessageMedia(
      {
        type: "photo",
        media: qrUrl,
        parse_mode: "HTML",
      },
      {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: {
          inline_keyboard: [
            [{ text: "بازگشت", callback_data: `show_service_${username}` }],
          ],
        },
      }
    );
  } catch (error) {
    console.error("Error sending QR code:", error);
    if (query.id) {
      await bot.answerCallbackQuery(query.id, {
        text: "خطا در ایجاد QRCode",
        show_alert: true,
      });
    }
  }
};

export default generateQRCode;
