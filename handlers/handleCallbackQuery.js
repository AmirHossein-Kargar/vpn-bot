// fuix
import handleTrxWalletScan from "./admin/handleTrxWalletScan.js";
import showPaymentMethods from "./message/showPaymentMethods.js";
import {
  clearSession,
  getSession,
  setSession,
} from "../config/sessionStore.js";
import keyboard from "../keyboards/mainKeyboard.js";
import { CHOOSE_OPTION_MESSAGE } from "../messages/staticMessages.js";
import promptForReceipt from "../paymentHandlers/promptForReceipt.js";
import { plans30, plans60, plans90 } from "../services/plans.js";
import handleBuyService from "../services/buyService/buyService.js";
import generatePlanButtons from "../keyboards/generatePlanButtons.js";
import confirmOrder from "../services/buyService/confirmOrder.js";
import orderService from "../services/buyService/orderService.js";
import User from "../models/User.js";
import invoice from "../models/invoice.js";
import CryptoInvoice from "../models/CryptoInvoice.js";
import showServiceDetails from "../services/manageServices/showServiceDetails.js";
import changeServiceLink from "../services/manageServices/changeServiceLink.js";
import generateQRCode from "../services/manageServices/generateQRCode.js";
import { deleteService } from "../api/wizardApi.js";
import deactivateServiceButton from "../services/manageServices/deactiveServiceButton.js";
import handleProfile from "./message/handleProfile.js";
import payTrx from "../paymentHandlers/payTrx.js";
import { sendTrxWallet } from "../paymentHandlers/handleTrxAmount.js";

const handleCallbackQuery = async (bot, query) => {
  const data = query.data;
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;
  const userId = query.from.id;
  const session = await getSession(chatId);

  switch (data) {
    case "back_to_topup":
      await bot.deleteMessage(chatId, messageId);

      // Debug: Log session data
      console.log("🔍 Back to topup - Session data:", {
        paymentId: session?.paymentId,
        paymentType: session?.paymentType,
        chatId: chatId,
      });

      // اگر کاربر پرداخت کارت به کارت داشت، رسید را حذف کن
      if (session?.paymentId && session?.paymentType === "bank") {
        try {
          await invoice.findOneAndDelete({ paymentId: session.paymentId });
          console.log("✅ Bank invoice removed:", session.paymentId);
        } catch (error) {
          console.error("Error removing bank invoice:", error.message);
        }
      }
      // اگر کاربر پرداخت کریپتو داشت، فاکتور کریپتو را حذف کن
      if (session?.paymentId && session?.paymentType === "crypto") {
        try {
          await CryptoInvoice.findOneAndDelete({
            invoiceId: session.paymentId,
          });
          console.log("✅ Crypto invoice removed:", session.paymentId);
        } catch (error) {
          console.error("Error removing crypto invoice:", error.message);
        }
      }
      // اگر کاربر پرداخت TRX داشت، فاکتور TRX را حذف کن
      if (session?.paymentId && session?.paymentType === "trx") {
        try {
          console.log(
            "🔍 Attempting to remove TRX invoice:",
            session.paymentId
          );
          const result = await CryptoInvoice.findOneAndDelete({
            invoiceId: session.paymentId,
          });
          console.log("✅ TRX invoice removed:", result);
        } catch (error) {
          console.error("Error removing TRX invoice:", error.message);
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
        // Continue execution even if message deletion fails
      }

      // Clear session first to prevent race conditions
      await clearSession(chatId);

      // Try to delete support message if it exists and is different from current message
      if (session?.supportMessageId && session.supportMessageId !== messageId) {
        try {
          await bot.deleteMessage(chatId, session.supportMessageId);
        } catch (error) {
          console.log("❗️خطا در حذف پیام پشتیبانی:", error.message);
          // Continue execution even if support message deletion fails
        }
      }

      await bot.sendMessage(chatId, CHOOSE_OPTION_MESSAGE, keyboard);
      break;

    case "pay_bank":
      {
        const payBank = (await import("./../paymentHandlers/payBank.js"))
          .default;
        await payBank(bot, query, session);
      }
      break;
    case "pay_trx":
      await payTrx(bot, query, session);
      break;
    case "send_trx_wallet":
      await sendTrxWallet(bot, chatId, session);
      break;
    case "back_to_home":
      await bot.deleteMessage(chatId, messageId);
      await clearSession(chatId);
      await bot.sendMessage(chatId, "🏠 به منوی اصلی بازگشتید.", {
        reply_markup: {
          keyboard: [
            ["🛒 خرید سرویس"],
            ["📦 سرویس‌های من", "💰 افزایش موجودی"],
            ["🎁 سرویس تست", "👤 پروفایل من"],
            ["🛠 پشتیبانی", "📖 راهنما"],
          ],
          resize_keyboard: true,
        },
      });
      break;

    case "upload_receipt":
      await promptForReceipt(bot, chatId, session);
      break;
    case "admin_scan_trx_wallet": {
      // فقط در گروه ادمین و برای ادمین‌ها
      const groupId = process.env.GROUP_ID;
      const adminIds = (process.env.ADMINS || "")
        .split(",")
        .filter(Boolean)
        .map((id) => Number(id.trim()));

      if (chatId.toString() !== String(groupId)) {
        await bot.answerCallbackQuery(query.id, {
          text: "⛔️ این عملیات فقط در گروه ادمین قابل انجام است",
          show_alert: true,
        });
        break;
      }
      if (!adminIds.includes(Number(userId))) {
        await bot.answerCallbackQuery(query.id, {
          text: "⛔️ شما دسترسی انجام این عملیات را ندارید",
          show_alert: true,
        });
        break;
      }
      await handleTrxWalletScan(bot, query, session);
      break;
    }
    case "admin_status": {
      // فقط در گروه ادمین و برای ادمین‌ها
      const groupId = process.env.GROUP_ID;
      const adminIds = (process.env.ADMINS || "")
        .split(",")
        .filter(Boolean)
        .map((id) => Number(id.trim()));

      if (chatId.toString() !== String(groupId)) {
        await bot.answerCallbackQuery(query.id, {
          text: "⛔️ این عملیات فقط در گروه ادمین قابل انجام است",
          show_alert: true,
        });
        break;
      }
      if (!adminIds.includes(Number(userId))) {
        await bot.answerCallbackQuery(query.id, {
          text: "⛔️ شما دسترسی انجام این عملیات را ندارید",
          show_alert: true,
        });
        break;
      }

      // ویرایش همان پیام با وضعیت سیستم (به جای ارسال پیام جدید)
      try {
        const { StatusApi } = await import("../api/wizardApi.js");
        const statusData = await StatusApi();

        if (statusData.ok) {
          const result = statusData.result;
          const statusMessage = `📊 وضعیت API\n\n💰 موجودی: <code>${
            result.balance
          } تومان</code>\n📦 کل سرویس‌ ها: <code>${
            result.count_services
          }</code>\n✅ سرویس‌ های فعال: <code>${
            result.count_active_services
          }</code>\n💾 قیمت هر گیگ: <code>${
            result.per_gb
          } تومان</code>\n📅 قیمت هر روز: <code>${
            result.per_day
          } تومان</code>\n🔗 وضعیت سیستم: <code>${
            result.system === "connected" ? "🟢 متصل" : "🔴 قطع"
          }</code>\n⚡ پینگ: <code>${
            result.ping
          }ms</code>\n\n🕐 آخرین بروزرسانی: <code>${new Date().toLocaleString(
            "fa-IR"
          )}</code>`;

          await bot.editMessageText(statusMessage, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🔍 اسکن ولت TRX",
                    callback_data: "admin_scan_trx_wallet",
                  },
                  { text: "🏠 بازگشت", callback_data: "admin_back_to_panel" },
                ],
              ],
            },
          });
        } else {
          await bot.editMessageText(
            `❌ خطا در دریافت وضعیت: ${statusData.error || "خطای نامشخص"}`,
            {
              chat_id: chatId,
              message_id: messageId,
              reply_markup: {
                inline_keyboard: [
                  [{ text: "🏠 بازگشت", callback_data: "admin_back_to_panel" }],
                ],
              },
            }
          );
        }
      } catch (error) {
        await bot.editMessageText(`❌ خطا در دریافت وضعیت`, {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: {
            inline_keyboard: [
              [{ text: "🏠 بازگشت", callback_data: "admin_back_to_panel" }],
            ],
          },
        });
      }
      break;
    }
    case "admin_back_to_panel": {
      // بازگشت به پنل مدیریت در گروه ادمین
      const groupId = process.env.GROUP_ID;
      const adminIds = (process.env.ADMINS || "")
        .split(",")
        .filter(Boolean)
        .map((id) => Number(id.trim()));

      if (
        chatId.toString() !== String(groupId) ||
        !adminIds.includes(Number(userId))
      ) {
        await bot.answerCallbackQuery(query.id, {
          text: "⛔️ دسترسی غیرمجاز",
          show_alert: true,
        });
        break;
      }

      await bot.editMessageText("🔒 پنل مدیریت", {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🔍 اسکن ولت TRX",
                callback_data: "admin_scan_trx_wallet",
              },
              { text: "📊 وضعیت سیستم", callback_data: "admin_status" },
            ],
          ],
        },
      });
      break;
    }
    case "confirm_payment":
      // Handle confirm payment logic here if needed
      break;
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
      await invoice.findOneAndDelete({ paymentId });

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
        "❌ پرداخت شما توسط ادمین رد شد. در صورت نیاز با پشتیبانی تماس بگیرید.",
        {
          reply_markup: keyboard.reply_markup,
        }
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
          inline_keyboard: [],
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
    await changeServiceLink(bot, chatId, messageId, data, query);
  }
  if (data.startsWith("delete_service_")) {
    const username = data.split("delete_service_")[1];
    await bot.editMessageText("آیا می خواهید این سرویس را حذف کنید؟", {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "❌ خیر",
              callback_data: `show_service_${username}`,
            },
            {
              text: "✅ بله",
              callback_data: `confirm_delete_service_${username}`,
            },
          ],
        ],
      },
    });
    await setSession(chatId, {
      step: "confirm_delete_service",
      username: username,
    });
    return;
  }
  if (data.startsWith("confirm_delete_service_")) {
    const username = data.split("confirm_delete_service_")[1];
    const res = await deleteService(username);
    // Decrement totalServices by 1, but never let it go below 0
    const user = await User.findOne({ telegramId: userId });
    if (user) {
      const newTotal = Math.max(0, (user.totalServices || 0) - 1);
      await User.updateOne(
        { telegramId: userId },
        {
          $pull: { services: { username: username } },
          $set: { totalServices: newTotal },
        }
      );
    }
    if (res.result) {
      await bot.editMessageText("✅ سرویس با موفقیت حذف شد.", {
        chat_id: chatId,
        message_id: messageId,
      });
    } else {
      await bot.editMessageText("❌ خطا در حذف سرویس.", {
        chat_id: chatId,
        message_id: messageId,
      });
    }
    return;
  }
  if (data.startsWith("qrcode_")) {
    await generateQRCode(bot, chatId, messageId, data, query);
    return;
  }
  if (data.startsWith("deactivate_service_")) {
    await deactivateServiceButton(bot, chatId, messageId, data, query);
    return;
  }
  if (data.startsWith("alert_discount_code_disabled")) {
    await bot.editMessageText("کد تخفیف فعلا غیرفعال است.", {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔄 بازگشت", callback_data: "back_to_profile" }],
        ],
      },
    });
    return;
  }
  if (data.startsWith("back_to_profile")) {
    await bot.deleteMessage(chatId, messageId);
    await handleProfile(bot, chatId, userId);
    return;
  }
  if (data.startsWith("extend_service_") || data.startsWith("extend_data_")) {
    await bot.answerCallbackQuery(query.id, {
      text: "⛔️ این آپشن در حال حاضر غیرفعال است! لطفا سرویس جدید خریداری فرمایید",
      show_alert: true,
    });
    return;
  }
};
export default handleCallbackQuery;
