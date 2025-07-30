import { createVpnService } from "../../api/wizardApi.js";
import {
  getSuccessServiceMessage,
  guideButtons,
} from "../../messages/staticMessages.js";
import User from "../../models/User.js";
import formatDate from "../../utils/formatDate.js";
import { checkUserBalance } from "./checkUserBalance.js";

async function handlePlanOrder(bot, chatId, userId, plan) {
  const hasBalance = await checkUserBalance(userId, plan.price);
  if (!hasBalance) {
    await bot.sendMessage(
      chatId,
      "⚠️ موجودی شما کافی نیست. لطفاً ابتدا حساب خود را شارژ کنید."
    );
    return;
  }

  try {
    const apiResponse = await createVpnService(plan.gig, plan.day, 0);

    const user = await User.findOne({ telegramId: userId });
    if (!user) {
      await bot.sendMessage(chatId, "❌ کاربر یافت نشد.");
      return;
    }

    if (apiResponse.ok) {
      user.balance -= plan.price;
      await user.save();

      const { username, sub_link, tak_links } = apiResponse.data;

      const successMessage = getSuccessServiceMessage({
        username,
        smartLink: sub_link,
        singleLink: tak_links[0],
      });

      await bot.sendMessage(chatId, successMessage, {
        parse_mode: "HTML",
        ...guideButtons,
      });
    } else {
      user.balance -= plan.price;
      await user.save();
      await bot.sendMessage(
        chatId,
        "📨 سفارش شما ثبت شد و به زودی بررسی خواهد شد. لطفاً منتظر بمانید."
      );

      const ADMIN_GROUP_ID = process.env.GROUP_ID;

      const msg = `📩 <b>سفارش جدید نیازمند ساخت دستی</b>
      
    👤 <b>نام:</b> <code>${user.firstName || "نامشخص"}</code>
     <b>آیدی عددی:</b> <code>${user.telegramId}</code>
      <b>شماره:</b> <code>${user.phoneNumber ? user.phoneNumber.replace(/^\+98/, "0") : "نامشخص"}</code>
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
    }
  } catch (error) {
    console.error("Error in plan order", error);

    await bot.sendMessage(
      chatId,
      "❌ خطایی در ایجاد سرویس رخ داد. لطفاً بعداً دوباره تلاش کنید."
    );
  }
}
export default handlePlanOrder;
