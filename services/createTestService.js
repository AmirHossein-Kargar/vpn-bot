import User from "../models/User.js";
import {
  getTestServiceMessage,
  guideButtons,
} from "../messages/staticMessages.js";
import { createTestService as createTestServiceApi } from "../api/wizardApi.js";
import normalizeServiceData from "../utils/normalizeServiceData.js";

const createTestService = async (bot, msg) => {
  const chatId = msg.chat.id;
  const userId = String(msg.from.id);

  let user = await User.findOne({ telegramId: userId });

  if (!user) {
    user = await User.create({ telegramId: userId });
  }

  if (user.hasReceivedTest == true) {
    await bot.sendMessage(chatId, "شما قبلاً این سرویس را دریافت کرده‌اید.");
    return;
  }

  try {
    const data = await createTestServiceApi();
    if (data.ok && data.result) {
      // Mark user as having received the test

      // Prepare dynamic message
      const result = data.result;

      const maxUser = 1;
      const maxUsageMB = 2;

      const smartLink = result.hash
        ? `https://iranisystem.com/bot/sub/?hash=${result.hash}`
        : result.sub_link || "";

      const singleLink =
        result.tak_links && result.tak_links.length > 0
          ? result.tak_links[0]
          : "";

      const username = result.username || "نامشخص";

      // Create test plan object for normalizeServiceData
      const testPlan = {
        gig: maxUsageMB,
        day: 1,
        name: "سرویس تست",
      };

      // Normalize service data using the same function as orderService
      const serviceData = normalizeServiceData(result, testPlan);

      // Add service to user's services array
      user.services.push(serviceData);
      user.hasReceivedTest = true;
      user.totalServices += 1;

      await user.save();

      const message = getTestServiceMessage({
        maxUser,
        maxUsageMB,
        smartLink,
        singleLink,
        username,
      });

      await bot.sendMessage(chatId, message, {
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: guideButtons.reply_markup,
      });
    } else {
      await bot.sendMessage(
        chatId,
        "خطا در دریافت سرویس تست. لطفاً بعداً تلاش کنید."
      );
    }
  } catch (error) {
    await bot.sendMessage(
      chatId,
      "خطا در ارتباط با سرور سرویس تست. لطفاً بعداً تلاش کنید."
    );
  }
};
export default createTestService;
