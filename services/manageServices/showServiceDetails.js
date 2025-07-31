import { findService } from "../../api/wizardApi.js";

const showServiceDetails = async (bot, chatId, username) => {
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

    const expireDatePersian = latest.expire_date;
    const daysLeft = latest.day;

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

    await bot.sendMessage(chatId, message, {
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
              callback_data: "change_link",
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
              text: "◽️دریافت QRCode",
              callback_data: "qrcode"
            }
          ]
        ],
      },
    });
  } catch (error) {
    console.error("Error showing service:", error);
    await bot.sendMessage(chatId, "❌ خطایی رخ داد، لطفا دوباره تلاش کنید.");
  }
};

export default showServiceDetails;
