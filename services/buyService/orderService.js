import { createVpnService } from "../../api/wizardApi.js";
import {
  getSuccessServiceMessage,
  guideButtons,
} from "../../messages/staticMessages.js";
import User from "../../models/User.js";
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

      const messageToAdmin = `
📩 <b>سفارش جدید نیازمند ساخت دستی</b>

👤 <b>نام:</b> ${user.firstName || "-"}
🆔 <b>Telegram ID:</b> <code>${user.telegramId}</code>
📞 <b>شماره:</b> <code>${user.phoneNumber || "نامشخص"}</code>
🧾 <b>تاریخ عضویت:</b> ${new Date(user.joinDate).toLocaleDateString("fa-IR")}

💰 <b>موجودی فعلی:</b> ${user.balance} تومان

🛒 <b>پلن انتخابی:</b> ${plan.name}
📦 <b>حجم:</b> ${plan.gig} گیگ
📆 <b>مدت:</b> ${plan.days} روز
💳 <b>قیمت:</b> ${plan.price} تومان

🧑‍💼 لطفاً این سفارش را به صورت دستی در پنل ایجاد کنید.
`;

      await bot.sendMessage(ADMIN_GROUP_ID, messageToAdmin, {
        parse_mode: "HTML",
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
