import axios from "axios";
import { createVpnService } from "../../api/wizardApi.js";
import {
  getSuccessServiceMessage,
  guideButtons,
} from "../../messages/staticMessages.js";
import User from "../../models/User.js";
import formatDate from "../../utils/formatDate.js";
import { checkUserBalance } from "./checkUserBalance.js";

/**
 * Attempts to create a VPN service for the user and send the config.
 * If automatic creation fails, notifies admins for manual handling.
 */
async function handlePlanOrder(bot, chatId, userId, plan) {
  // Check user balance
  const hasBalance = await checkUserBalance(userId, plan.price);
  if (!hasBalance) {
    await bot.sendMessage(
      chatId,
      "⚠️ موجودی شما کافی نیست. لطفاً ابتدا حساب خود را شارژ کنید."
    );
    return;
  }

  // Fetch user from DB
  const user = await User.findOne({ telegramId: userId });
  if (!user) {
    await bot.sendMessage(chatId, "❌ کاربر یافت نشد.");
    return;
  }

  try {
    // Try to create VPN service automatically
    const apiResponse = await createVpnService(plan.gig, plan.days, 0);

    if (apiResponse && apiResponse.ok && apiResponse.result) {
      // Service created successfully
      const username = apiResponse.result.username || "نامشخص";
      // Compose the correct sub_link as per new format
      const hash = apiResponse.result.hash;
      const smartLink = hash
        ? `https://iranisystem.com/bot/sub/?hash=${hash}`
        : "";
      const singleLink = Array.isArray(apiResponse.result.tak_links)
        ? apiResponse.result.tak_links[0] || ""
        : "";

      user.services.push({ username });
      user.balance -= plan.price;
      user.totalServices = (user.totalServices || 0) + 1;
      await user.save();

      // Get QR code as a file (not as POST, but as a file URL)
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
        smartLink
      )}&size=200x200&margin=20`;

      const successMessage = getSuccessServiceMessage({
        username,
        smartLink,
        singleLink,
      });

      // Send config to user
      await bot.sendPhoto(chatId, qrUrl, {
        caption: successMessage,
        parse_mode: "HTML",
        ...guideButtons,
      });
      return;
    }

    // Automatic creation failed, fallback to manual
    user.balance -= plan.price;
    user.totalServices = (user.totalServices || 0) + 1;
    await user.save();
    await bot.sendMessage(
      chatId,
      "📨 سفارش شما ثبت شد و به زودی بررسی خواهد شد. لطفاً منتظر بمانید."
    );

    const ADMIN_GROUP_ID = process.env.GROUP_ID;

    const msg = `📩 <b>سفارش جدید نیازمند ساخت دستی</b>
      
    👤 <b>نام:</b> <code>${user.firstName || "نامشخص"}</code>
     <b>آیدی عددی:</b> <code>${user.telegramId}</code>
      <b>شماره:</b> <code>${
        user.phoneNumber ? user.phoneNumber.replace(/^\+98/, "0") : "نامشخص"
      }</code>
    🧾 <b>تاریخ عضویت:</b> <code>${formatDate(user.createdAt)}</code>
      
    💰 <b>موجودی فعلی:</b> <code>${user.balance} تومان</code>
      
    🛒 <b>پلن انتخابی:</b> <code>${plan.name}</code>
    📦 <b>حجم:</b> <code>${plan.gig} گیگ</code>
    📆 <b>مدت:</b> <code>${plan.days} روز</code>
    💳 <b>قیمت:</b> <code>${plan.price} تومان</code>
      
    🧑‍💼 لطفاً این سفارش را به صورت دستی در پنل ایجاد کرده و سپس ارسال نمایید.
      `;

    await bot.sendMessage(ADMIN_GROUP_ID, msg, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "ارسال کانفیگ به کاربر",
              callback_data: `send_config_to_user_${user.telegramId}`,
            },
          ],
        ],
      },
    });
    return;
  } catch (error) {
    // Log error for debugging
    console.error("Error in plan order", error);

    await bot.sendMessage(
      chatId,
      "❌ خطایی در ایجاد سرویس رخ داد. لطفاً بعداً دوباره تلاش کنید."
    );
    return;
  }
}

export default handlePlanOrder;
