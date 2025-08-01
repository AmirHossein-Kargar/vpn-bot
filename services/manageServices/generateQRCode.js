import { findService } from "../../api/wizardApi.js";
import User from "../../models/User.js";

const generateQRCode = async (bot, chatId, messageId, data, query = {}) => {
  // data is expected to be like "qrcode_USERNAME"
  const username = data.split("qrcode_")[1];
  const userId = query.from?.id;

  if (!userId) {
    await bot.answerCallbackQuery(query.id, {
      text: "خطا در شناسایی کاربر.",
      show_alert: true,
    });
    return;
  }

  // Get user from database to verify ownership
  const user = await User.findOne({ telegramId: userId });
  if (!user) {
    await bot.answerCallbackQuery(query.id, {
      text: "کاربر پیدا نشد.",
      show_alert: true,
    });
    return;
  }

  // Check if user owns this service
  const service = user.services.find((s) => s.username === username);
  if (!service) {
    await bot.answerCallbackQuery(query.id, {
      text: "سرویس پیدا نشد.",
      show_alert: true,
    });
    return;
  }

  // Fetch service data from API to get the subscription link
  try {
    const apiResponse = await findService(username);

    if (!apiResponse || apiResponse.error) {
      await bot.answerCallbackQuery(query.id, {
        text: "خطا در دریافت اطلاعات سرویس.",
        show_alert: true,
      });
      return;
    }

    const res = apiResponse.result;
    if (!res) {
      await bot.answerCallbackQuery(query.id, {
        text: "اطلاعات سرویس یافت نشد.",
        show_alert: true,
      });
      return;
    }

    // Generate subscription link from API response
    const subscriptionLink = res.hash
      ? `https://iranisystem.com/bot/sub/?hash=${res.hash}`
      : res.sub_link || "";

    if (!subscriptionLink) {
      await bot.answerCallbackQuery(query.id, {
        text: "لینک اشتراک یافت نشد.",
        show_alert: true,
      });
      return;
    }

    // Generate QR code URL using the subscription link
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
      subscriptionLink
    )}&size=200x200&margin=20`; // 20px margin around the QR code

    try {
      await bot.editMessageMedia(
        {
          type: "photo",
          media: qrUrl,
          caption: `🔗 QRCode برای سرویس <code>${username}</code>\n\n📱 این QR کد را با اپلیکیشن VPN خود اسکن کنید.`,
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
  } catch (error) {
    console.error("Error fetching service data:", error);
    if (query.id) {
      await bot.answerCallbackQuery(query.id, {
        text: "خطا در دریافت اطلاعات سرویس",
        show_alert: true,
      });
    }
  }
};

export default generateQRCode;
