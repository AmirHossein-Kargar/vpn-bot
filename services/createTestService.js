import axios from "axios";
import User from "../models/User.js";
import {
  getTestServiceMessage,
  guideButtons,
} from "../messages/staticMessages.js";

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
    // Send POST request to external API for test service
    const response = await axios.post(
      "https://robot.wizardxray.shop/bot/api/v1/create",
      new URLSearchParams({ test: "1" }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${process.env.VPN_API_KEY}`,
        },
      }
    );
    const data = response.data;
    if (data.ok && data.result) {
      // Mark user as having received the test
      user.hasReceivedTest = true;
      await user.save();

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
