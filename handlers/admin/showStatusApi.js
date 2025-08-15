import { StatusApi } from "../../api/wizardApi.js";

const showStatusApi = async (bot, msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  // Get admin IDs from environment variable
  const adminIds = process.env.ADMINS.split(",").map((id) => Number(id.trim()));

  // فقط در گروه ادمین
  if (chatId.toString() !== String(process.env.GROUP_ID)) {
    await bot.sendMessage(
      chatId,
      "⛔️ این دستور فقط در گروه ادمین قابل استفاده است."
    );
    return;
  }
  if (!adminIds.includes(userId)) {
    await bot.sendMessage(
      chatId,
      "⛔️ فقط ادمین‌ ها به این دستور دسترسی دارند."
    );
    return;
  }
  try {
    const statusData = await StatusApi();

    if (statusData.ok) {
      const result = statusData.result;
      const statusMessage = `📊 وضعیت API

💰 موجودی: <code>${result.balance} تومان</code>
📦 کل سرویس‌ها: <code>${result.count_services}</code>
✅ سرویس‌های فعال: <code>${result.count_active_services}</code>
💾 قیمت هر گیگ: <code>${result.per_gb} تومان</code>
📅 قیمت هر روز: <code>${result.per_day} تومان</code>
🔗 وضعیت سیستم: <code>${
        result.system === "connected" ? "🟢 متصل" : "🔴 قطع"
      }</code>
⚡ پینگ: <code>${result.ping}ms</code>

🕐 آخرین بروزرسانی: <code>${new Date().toLocaleString("fa-IR")}</code>`;

      await bot.sendMessage(chatId, statusMessage, {
        parse_mode: "HTML",
      });
    } else {
      await bot.sendMessage(
        chatId,
        `❌ خطا در دریافت وضعیت: ${statusData.error || "خطای نامشخص"}`
      );
    }
  } catch (error) {
    console.error("❌ Error in /status command:", error);
    await bot.sendMessage(chatId, "❌ خطا در دریافت وضعیت سیستم");
  }
};
export default showStatusApi;
