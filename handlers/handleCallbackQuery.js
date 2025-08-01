// fuix
import handleAddBalance from "./admin/handleAddBalance.js";
import showPaymentMethods from "./message/showPaymentMethods.js";
import {
  clearSession,
  getSession,
  setSession,
} from "../config/sessionStore.js";
import keyboard from "../keyboards/mainKeyboard.js";
import { CHOOSE_OPTION_MESSAGE } from "../messages/staticMessages.js";
import promptForReceipt from "../paymentHandlers/promptForReceipt.js";
import sendAdminPanels from "./admin/sendAdminPanels.js";
import { plans30, plans60, plans90 } from "../services/plans.js";
import handleBuyService from "../services/buyService/buyService.js";
import generatePlanButtons from "../keyboards/generatePlanButtons.js";
import confirmOrder from "../services/buyService/confirmOrder.js";
import orderService from "../services/buyService/orderService.js";
import User from "../models/User.js";
import invoice from "../models/invoice.js";
import showServiceDetails from "../services/manageServices/showServiceDetails.js";
import { changeLinkService, findService } from "../api/wizardApi.js";
import normalizeServiceData from "../utils/normalizeServiceData.js";

const handleCallbackQuery = async (bot, query) => {
  const data = query.data;
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;
  const userId = query.from.id;
  const session = await getSession(chatId);

  switch (data) {
    case "back_to_topup":
      await bot.deleteMessage(chatId, messageId);

      if (session?.paymentId) {
        try {
          await invoice.findOneAndDelete({ paymentId: session.paymentId });
          console.log(
            `🗑️ Invoice with paymentId ${session.paymentId} removed from database`
          );
        } catch (error) {
          console.error("Error removing invoice:", error.message);
        }
      }

      await clearSession(chatId);
      await showPaymentMethods(bot, chatId);
      break;

    case "back_to_home":
      try {
        await bot.deleteMessage(chatId, messageId);
      } catch (error) {
        console.log("❗️خطا در حذف پیام اصلی:", error.message);
      }
      try {
        if (session?.supportMessageId) {
          await bot.deleteMessage(chatId, session.supportMessageId);
        }
      } catch (error) {
        console.log("❗️خطا در حذف پیام پشتیبانی:", error.message);
      }

      await clearSession(chatId);
      await bot.sendMessage(chatId, CHOOSE_OPTION_MESSAGE, keyboard);
      break;

    case "pay_bank":
      {
        const payBank = (await import("./../paymentHandlers/payBank.js"))
          .default;
        await payBank(bot, query, session);
      }
      break;

    case "upload_receipt":
      await promptForReceipt(bot, chatId, session);
      break;
    case "admin_add_balance":
      await handleAddBalance(bot, query, session);
      break;
    case "admin_back_to_main":
      await sendAdminPanels(bot, chatId, messageId);
      break;
    case "confirm_payment": {
    }
    case "duration_30":
      await bot.editMessageText(
        "💡 لطفاً یکی از پلن‌های 30 روزه را انتخاب کنید:",
        {
          chat_id: chatId,
          message_id: messageId,
          ...generatePlanButtons(plans30),
        }
      );
      break;

    case "duration_60":
      await bot.editMessageText(
        "💡 لطفاً یکی از پلن‌های 60 روزه را انتخاب کنید:",
        {
          chat_id: chatId,
          message_id: messageId,
          ...generatePlanButtons(plans60),
        }
      );
      break;

    case "duration_90":
      await bot.editMessageText(
        "💡 لطفاً یکی از پلن‌های 90 روزه را انتخاب کنید:",
        {
          chat_id: chatId,
          message_id: messageId,
          ...generatePlanButtons(plans90),
        }
      );
      break;

    case "buy_service_back_to_main":
      await bot.deleteMessage(chatId, messageId);
      await bot.sendMessage(chatId, CHOOSE_OPTION_MESSAGE);
      break;
    case "buy_service_back":
      await bot.deleteMessage(chatId, messageId);
      await handleBuyService(bot, chatId);
      break;
    // case "pay_ton":
    //   await showPaymentStep(bot, chatId, messageId, {
    //     stepKey: "waiting_for_ton_amount",
    //     message:
    //       "💠 لطفاً مبلغ مورد نظر را برای پرداخت با تون وارد کنید (بین 50,000 تا 500,000 تومان):",
    //   });
    //   break;
    // default:
    //   break;
  }

  // Handle confirm payment callback
  if (data.startsWith("confirm_payment_")) {
    const parts = data.split("_");
    if (parts.length >= 5) {
      const userId = parts[2];
      const amount = parseInt(parts[3].replace(/,/g, ""));
      const paymentId = parts[4];

      try {
        const user = await User.findOneAndUpdate(
          { telegramId: userId },
          { $inc: { balance: amount, successfulPayments: 1 } },
          { new: true }
        );

        if (!user) {
          await bot.answerCallbackQuery(query.id, {
            text: "❌ کاربر یافت نشد",
            show_alert: true,
          });
          return;
        }

        await invoice.findOneAndUpdate(
          { paymentId: paymentId },
          { status: "confirmed" }
        );

        await bot.editMessageReplyMarkup(
          { inline_keyboard: [] },
          {
            chat_id: chatId,
            message_id: messageId,
          }
        );

        await bot.sendMessage(
          chatId,
          "✅ پرداخت تایید شد و موجودی کاربر افزایش یافت."
        );
        await bot.sendMessage(
          userId,
          `✅ پرداخت شما تایید شد!\n💰 مبلغ ${amount.toLocaleString(
            "en-US"
          )} تومان به کیف پول شما اضافه شد.`,
          {
            reply_markup: keyboard.reply_markup,
          }
        );

        await bot.answerCallbackQuery(query.id, {
          text: "✅ پرداخت تایید شد و موجودی کاربر افزایش یافت",
        });
      } catch (error) {
        console.error("Error confirming payment:", error);
        await bot.answerCallbackQuery(query.id, {
          text: "❌ خطا در تایید پرداخت",
        });
      }

      return;
    }
  }

  if (data.startsWith("reject_payment_")) {
    const [paymentId, userId] = data.split("reject_payment_")[1].split("_");
    if (!userId) {
      console.error("❗ userId is missing in callback_data");
      return;
    }

    try {
      await invoice.findOneAndUpdate(
        { paymentId: paymentId },
        { status: "rejected" }
      );

      await bot.editMessageReplyMarkup(
        { inline_keyboard: [] },
        {
          chat_id: chatId,
          message_id: messageId,
        }
      );

      await bot.sendMessage(chatId, "❌ پرداخت رد شد.");

      await bot.sendMessage(
        userId,
        "❌ پرداخت شما توسط ادمین رد شد. در صورت نیاز با پشتیبانی تماس بگیرید."
      );

      await bot.answerCallbackQuery(query.id, {
        text: "❌ پرداخت رد شد",
      });
    } catch (error) {
      console.error("Error rejecting payment:", error);
      await bot.answerCallbackQuery(query.id, {
        text: "❌ خطا در رد پرداخت",
        show_alert: true,
      });
    }
    return;
  }

  if (data.startsWith("send_config_to_user_")) {
    const userId = data.split("send_config_to_user_")[1];

    const sentMsg = await bot.sendMessage(
      chatId,
      "📝 لطفاً کانفیگ سرویس را ارسال کنید:",
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🔄 بازگشت به پنل مدیریت",
                callback_data: "admin_back_to_main",
              },
            ],
          ],
        },
      }
    );

    await setSession(chatId, {
      step: "waiting_for_config_details",
      targetUserId: userId,
      messageId: sentMsg.message_id,
    });

    return;
  }

  if (data.startsWith("plan_")) {
    const planId = data.replace("plan_", "");

    const allPlans = [...plans30, ...plans60, ...plans90];
    const selectedPlan = allPlans.find((plan) => plan.id === planId);

    if (!selectedPlan) {
      await bot.sendMessage(chatId, "❌ پلن مورد نظر یافت نشد.");
      return;
    }

    const { message, replyMarkup } = confirmOrder(selectedPlan);

    await bot.editMessageText(message, {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: replyMarkup,
      disable_web_page_preview: true,
      parse_mode: "HTML",
    });

    return;
  }

  if (data.startsWith("confirm_order_")) {
    const planId = data.split("confirm_order_")[1];
    const allPlans = [...plans30, ...plans60, ...plans90];
    const selectedPlan = allPlans.find((p) => p.id.toString() === planId);

    if (!selectedPlan) {
      return bot.sendMessage(chatId, "❌ پلن مورد نظر یافت نشد.");
    }

    try {
      await User.findOneAndUpdate(
        { telegramId: userId },
        { $inc: { totalServices: 1 } }
      );
    } catch (err) {
      console.error("Error incrementing totalServices for user:", err);
    }

    await bot.deleteMessage(chatId, messageId);
    await orderService(bot, chatId, userId, selectedPlan);
    return;
  }
  if (data.startsWith("register_vpn_id")) {
    const targetTelegramId = data.split(":")[1];

    await setSession(chatId, {
      step: "waiting_for_vpn_id",
      targetTelegramId,
      messageId: messageId,
    });

    await bot.editMessageText("🔑 لطفاً آیدی سرویس را وارد کنید:", {
      chat_id: chatId,
      message_id: messageId,
    });
    return;
  }

  if (data.startsWith("show_service_")) {
    const username = data.split("show_service_")[1];
    await showServiceDetails(bot, chatId, username, messageId);
    return;
  }
  if (data.startsWith("change_link_")) {
    let username;
    try {
      username = data.split("change_link_")[1];
      const res = await changeLinkService(username);

      // Check if API call was successful
      if (!res || !res.result || !res.result.new_sub_link) {
        console.error("Failed to change link:", res);
        await bot.editMessageText(
          "❌ خطا در تغییر لینک. لطفاً دوباره تلاش کنید.",
          {
            chat_id: chatId,
            message_id: messageId,
          }
        );
        return;
      }

      // Update the database using findOneAndUpdate for better reliability
      const updateResult = await User.findOneAndUpdate(
        {
          telegramId: userId,
          "services.username": username,
        },
        {
          $set: {
            "services.$.sub_link": res.result.new_sub_link,
          },
        },
        { new: true }
      );

      if (!updateResult) {
        console.error("User or service not found for update");
        await bot.editMessageText(
          "❌ خطا در بروزرسانی اطلاعات. لطفاً دوباره تلاش کنید.",
          {
            chat_id: chatId,
            message_id: messageId,
          }
        );
        return;
      }

      console.log(
        "Database updated successfully for user:",
        userId,
        "service:",
        username
      );
    } catch (error) {
      console.error("Error in change_link handler:", error);
      await bot.editMessageText(
        "❌ خطا در تغییر لینک. لطفاً دوباره تلاش کنید.",
        {
          chat_id: chatId,
          message_id: messageId,
        }
      );
      return;
    }

    await bot.editMessageText(
      `🔗 لینک اتصال شما با موفقیت تغییر کرد.\n\n🔸 جهت دریافت اطلاعات سرویس و مشاهده لینک جدید، بر روی گزینه برگشت کلیک بفرمایید .`,
      {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "بازگشت",
                callback_data: `show_service_${username}`,
              },
            ],
          ],
        },
      }
    );
    return;
  }
};

export default handleCallbackQuery;
