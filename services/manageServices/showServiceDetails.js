import { findService } from "../../api/wizardApi.js";

const showServiceDetails = async (bot, chatId, username, messageId) => {
  try {
    const apiResponse = await findService(username);

    if (!apiResponse) {
      await bot.sendMessage(chatId, "❌ سرویس یافت نشد.");
      return;
    }

    if (apiResponse.error) {
      await bot.sendMessage(
        chatId,
        `❌ خطا در دریافت اطلاعات سرویس: ${apiResponse.error}`
      );
      return;
    }

    const res = apiResponse.result;
    if (!res) {
      await bot.sendMessage(chatId, "❌ اطلاعات سرویس یافت نشد.");
      return;
    }

    const online = res.online_info || {};
    const latest = res.latest_info || {};

    const expireDatePersian = latest.expire_date || "نامشخص";
    const daysLeft = latest.day ?? "نامشخص";

    const smartLink = res.hash
      ? `https://iranisystem.com/bot/sub/?hash=${res.hash}`
      : res.sub_link || "";

    const message = `
    #⃣ کد سرویس : <code>${res.username}</code>

▫️ وضعیت سرویس : ${
      online.status === "active" ? "<code>🟢 فعال</code>" : "🔴 غیرفعال"
    }

📦 حجم سرویس : <code>${latest.gig || "نامشخص"} گیگابایت</code>
📥 حجم مصرفی : <code>${online.usage_converted || 0}</code>
📅 تاریخ انقضا : <code>${expireDatePersian} | ${daysLeft} روز دیگر</code>

🔗 لینک اتصال (Subscription) :

<code>${smartLink}</code>

▫️ یکی از گزینه های زیر را انتخاب کنید.`;

    if (messageId) {
      await bot.editMessageText(message, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "‼️چجوری به سرویس متصل بشم‼️",
                url: "https://t.me/swift_shield/9",
              }
            ],
            [
              {
                text: "🛑 تغییر لینک و قطع دسترسی دیگران 🛑",
                callback_data: `change_link_${res.username}`,
              }
            ],
            [
              {
                text: "⏳ تمدید سرویس و افزایش حجم",
                callback_data: "extend_or_increase",
              }
            ],
            [
              {
                text: "🗑 حذف سرویس",
                callback_data: `delete_service_${res.username}`,
              },
              {
                text: "◽️دریافت QRCode",
                callback_data: "qrcode"
              },
            ]
          ],
        },
      });
    }
  } catch (error) {
    console.error("Error showing service:", error);
    await bot.sendMessage(chatId, "❌ خطایی رخ داد، لطفا دوباره تلاش کنید.");
  }
};

export default showServiceDetails;
