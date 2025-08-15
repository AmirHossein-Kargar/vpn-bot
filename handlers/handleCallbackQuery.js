// fuix
import handleTrxWalletScan from "./admin/handleTrxWalletScan.js";
import showTrxBalance from "./admin/showTrxBalance.js";
import showTrxStats from "./admin/showTrxStats.js";
import showTrxRecent from "./admin/showTrxRecent.js";
import showTrxScanStatus from "./admin/showTrxScanStatus.js";
import detailedFinancialReport from "./admin/detailedFinancialReport.js";
import bankReport from "./admin/bankReport.js";
import usersReport from "./admin/usersReport.js";
import monthlyReport from "./admin/monthlyReport.js";
import profitChart from "./admin/profitChart.js";
import cryptoReport from "./admin/cryptoReport.js";
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
    case "admin_financial_report": {
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

      try {
        // 1) Revenue inputs
        const paidCrypto = await CryptoInvoice.find({ status: "paid" });
        const confirmedBank = await invoice.find({
          status: { $in: ["paid", "confirmed"] },
        });
        const cryptoSum = paidCrypto.reduce(
          (sum, inv) => sum + (inv.amount || 0),
          0
        );
        const bankSum = confirmedBank.reduce(
          (sum, inv) => sum + (inv.amount || 0),
          0
        );
        const totalTopups = cryptoSum + bankSum;

        // Current liabilities (wallet balances)
        const users = await User.find({});
        const totalBalances = users.reduce(
          (sum, u) => sum + (u.balance || 0),
          0
        );

        // Recognized revenue = money actually spent on services
        const recognizedRevenue = Math.max(0, totalTopups - totalBalances);

        // 2) Estimate sold plans using greedy mapping to known plan prices (no output)
        const allPlans = [...plans30, ...plans60, ...plans90]
          .map((p) => ({ price: p.price, gig: p.gig, days: p.days }))
          .sort((a, b) => b.price - a.price);
        let remaining = recognizedRevenue;
        let estGigSold = 0;
        let estDaysSold = 0;
        for (const plan of allPlans) {
          if (plan.price > 0 && remaining >= plan.price) {
            const cnt = Math.floor(remaining / plan.price);
            if (cnt > 0) {
              estGigSold += cnt * (plan.gig || 0);
              estDaysSold += cnt * (plan.days || 0);
              remaining -= cnt * plan.price;
            }
          }
        }

        // 3) Cost model based on user's constants (defaults: day=200, gb=3000)
        const costPerDay = Number(process.env.COST_PER_DAY || 200);
        const costPerGb = Number(process.env.COST_PER_GB || 300);
        const totalCost = estDaysSold * costPerDay + estGigSold * costPerGb;
        const profit = recognizedRevenue - totalCost;

        const report =
          `💵 <b>گزارش مالی جامع</b>\n\n` +
          `💰 <b>درآمدها:</b>\n` +
          `• کل شارژهای تایید شده: <code>${totalTopups.toLocaleString()}</code> تومان\n` +
          `• شارژهای کریپتو: <code>${cryptoSum.toLocaleString()}</code> تومان\n` +
          `• شارژهای بانکی: <code>${bankSum.toLocaleString()}</code> تومان\n\n` +
          `👛 <b>موجودی‌ها:</b>\n` +
          `• مجموع موجودی فعلی کاربران: <code>${totalBalances.toLocaleString()}</code> تومان\n\n` +
          `📊 <b>آمار:</b>\n` +
          `• درآمد واقعی: <code>${recognizedRevenue.toLocaleString()}</code> تومان\n` +
          `• تخمین گیگ فروخته شده: <code>${estGigSold.toLocaleString()}</code> GB\n` +
          `• تخمین روز فروخته شده: <code>${estDaysSold.toLocaleString()}</code> روز\n\n` +
          `💸 <b>هزینه‌ها:</b>\n` +
          `• هزینه کل: <code>${totalCost.toLocaleString()}</code> تومان\n` +
          `• هزینه هر گیگ: <code>${costPerGb.toLocaleString()}</code> تومان\n` +
          `• هزینه هر روز: <code>${costPerDay.toLocaleString()}</code> تومان\n\n` +
          `📈 <b>سود خالص:</b> <code>${profit.toLocaleString()}</code> تومان`;

        await bot.editMessageText(report, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "📊 جزئیات بیشتر",
                  callback_data: "admin_detailed_financial",
                },
                {
                  text: "📅 گزارش ماهانه",
                  callback_data: "admin_monthly_report",
                },
              ],
              [
                {
                  text: "💰 گزارش کریپتو",
                  callback_data: "admin_crypto_report",
                },
                { text: "🏦 گزارش بانکی", callback_data: "admin_bank_report" },
              ],
              [
                { text: "📈 نمودار سود", callback_data: "admin_profit_chart" },
                {
                  text: "👥 گزارش کاربران",
                  callback_data: "admin_users_report",
                },
              ],
              [{ text: "🏠 بازگشت", callback_data: "admin_back_to_panel" }],
            ],
          },
        });
      } catch (error) {
        await bot.editMessageText(`❌ خطا در محاسبه گزارش مالی`, {
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
      }
      await clearSession(chatId);
      if (session?.supportMessageId && session.supportMessageId !== messageId) {
        try {
          await bot.deleteMessage(chatId, session.supportMessageId);
        } catch {}
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
      // بررسی دسترسی ادمین
      const groupId = process.env.GROUP_ID;
      const adminIds = (process.env.ADMINS || "")
        .split(",")
        .filter(Boolean)
        .map((id) => Number(id.trim()));

      // اگر GROUP_ID تعریف نشده، اجازه دسترسی بده
      if (groupId && chatId.toString() !== String(groupId)) {
        await bot.answerCallbackQuery(query.id, {
          text: "⛔️ این عملیات فقط در گروه ادمین قابل انجام است",
          show_alert: true,
        });
        break;
      }

      // اگر ADMINS تعریف نشده، اجازه دسترسی بده
      if (adminIds.length > 0 && !adminIds.includes(Number(userId))) {
        await bot.answerCallbackQuery(query.id, {
          text: "⛔️ شما دسترسی انجام این عملیات را ندارید",
          show_alert: true,
        });
        break;
      }

      console.log("🔍 Calling handleTrxWalletScan...");
      await handleTrxWalletScan(bot, query, session);
      break;
    }
    case "admin_trx_balance": {
      // بررسی دسترسی ادمین
      const groupId = process.env.GROUP_ID;
      const adminIds = (process.env.ADMINS || "")
        .split(",")
        .filter(Boolean)
        .map((id) => Number(id.trim()));

      // اگر GROUP_ID تعریف نشده، اجازه دسترسی بده
      if (groupId && chatId.toString() !== String(groupId)) {
        await bot.answerCallbackQuery(query.id, {
          text: "⛔️ این عملیات فقط در گروه ادمین قابل انجام است",
          show_alert: true,
        });
        break;
      }

      // اگر ADMINS تعریف نشده، اجازه دسترسی بده
      if (adminIds.length > 0 && !adminIds.includes(Number(userId))) {
        await bot.answerCallbackQuery(query.id, {
          text: "⛔️ شما دسترسی انجام این عملیات را ندارید",
          show_alert: true,
        });
        break;
      }

      console.log("🔍 Calling showTrxBalance...");
      await showTrxBalance(bot, query, session);
      break;
    }
    case "admin_trx_stats": {
      // بررسی دسترسی ادمین
      const groupId = process.env.GROUP_ID;
      const adminIds = (process.env.ADMINS || "")
        .split(",")
        .filter(Boolean)
        .map((id) => Number(id.trim()));

      // اگر GROUP_ID تعریف نشده، اجازه دسترسی بده
      if (groupId && chatId.toString() !== String(groupId)) {
        await bot.answerCallbackQuery(query.id, {
          text: "⛔️ این عملیات فقط در گروه ادمین قابل انجام است",
          show_alert: true,
        });
        break;
      }

      // اگر ADMINS تعریف نشده، اجازه دسترسی بده
      if (adminIds.length > 0 && !adminIds.includes(Number(userId))) {
        await bot.answerCallbackQuery(query.id, {
          text: "⛔️ شما دسترسی انجام این عملیات را ندارید",
          show_alert: true,
        });
        break;
      }

      console.log("🔍 Calling showTrxStats...");
      await showTrxStats(bot, query, session);
      break;
    }
    case "admin_trx_recent": {
      // بررسی دسترسی ادمین
      const groupId = process.env.GROUP_ID;
      const adminIds = (process.env.ADMINS || "")
        .split(",")
        .filter(Boolean)
        .map((id) => Number(id.trim()));

      // اگر GROUP_ID تعریف نشده، اجازه دسترسی بده
      if (groupId && chatId.toString() !== String(groupId)) {
        await bot.answerCallbackQuery(query.id, {
          text: "⛔️ این عملیات فقط در گروه ادمین قابل انجام است",
          show_alert: true,
        });
        break;
      }

      // اگر ADMINS تعریف نشده، اجازه دسترسی بده
      if (adminIds.length > 0 && !adminIds.includes(Number(userId))) {
        await bot.answerCallbackQuery(query.id, {
          text: "⛔️ شما دسترسی انجام این عملیات را ندارید",
          show_alert: true,
        });
        break;
      }

      console.log("🔍 Calling showTrxRecent...");
      await showTrxRecent(bot, query, session);
      break;
    }
    case "admin_trx_scan_status": {
      // بررسی دسترسی ادمین
      const groupId = process.env.GROUP_ID;
      const adminIds = (process.env.ADMINS || "")
        .split(",")
        .filter(Boolean)
        .map((id) => Number(id.trim()));

      // اگر GROUP_ID تعریف نشده، اجازه دسترسی بده
      if (groupId && chatId.toString() !== String(groupId)) {
        await bot.answerCallbackQuery(query.id, {
          text: "⛔️ این عملیات فقط در گروه ادمین قابل انجام است",
          show_alert: true,
        });
        break;
      }

      // اگر ADMINS تعریف نشده، اجازه دسترسی بده
      if (adminIds.length > 0 && !adminIds.includes(Number(userId))) {
        await bot.answerCallbackQuery(query.id, {
          text: "⛔️ شما دسترسی انجام این عملیات را ندارید",
          show_alert: true,
        });
        break;
      }

      console.log("🔍 Calling showTrxScanStatus...");
      await showTrxScanStatus(bot, query, session);
      break;
    }
    case "admin_status": {
      // بررسی دسترسی ادمین
      const groupId = process.env.GROUP_ID;
      const adminIds = (process.env.ADMINS || "")
        .split(",")
        .filter(Boolean)
        .map((id) => Number(id.trim()));

      // اگر GROUP_ID تعریف نشده، اجازه دسترسی بده
      if (groupId && chatId.toString() !== String(groupId)) {
        await bot.answerCallbackQuery(query.id, {
          text: "⛔️ این عملیات فقط در گروه ادمین قابل انجام است",
          show_alert: true,
        });
        break;
      }

      // اگر ADMINS تعریف نشده، اجازه دسترسی بده
      if (adminIds.length > 0 && !adminIds.includes(Number(userId))) {
        await bot.answerCallbackQuery(query.id, {
          text: "⛔️ شما دسترسی انجام این عملیات را ندارید",
          show_alert: true,
        });
        break;
      }

      try {
        const { StatusApi } = await import("../api/wizardApi.js");
        const statusData = await StatusApi();

        if (statusData.ok) {
          const result = statusData.result;
          const statusMessage =
            `📊 <b>وضعیت سیستم</b>\n\n` +
            `🔗 <b>وضعیت اتصال:</b>\n` +
            `• سیستم: <code>${
              result.system === "connected" ? "🟢 متصل" : "🔴 قطع"
            }</code>\n` +
            `• پینگ: <code>${result.ping}ms</code>\n\n` +
            `💰 <b>موجودی:</b>\n` +
            `• موجودی فعلی: <code>${result.balance} تومان</code>\n\n` +
            `📦 <b>سرویس‌ها:</b>\n` +
            `• کل سرویس‌ها: <code>${result.count_services}</code>\n` +
            `• سرویس‌های فعال: <code>${result.count_active_services}</code>\n` +
            `• سرویس‌های غیرفعال: <code>${
              result.count_services - result.count_active_services
            }</code>\n\n` +
            `💵 <b>قیمت‌ها:</b>\n` +
            `• هر گیگ: <code>${result.per_gb} تومان</code>\n` +
            `• هر روز: <code>${result.per_day} تومان</code>\n\n` +
            `📈 <b>آمار:</b>\n` +
            `• درصد فعال: <code>${
              result.count_services > 0
                ? Math.round(
                    (result.count_active_services / result.count_services) * 100
                  )
                : 0
            }%</code>\n\n` +
            `🕐 <b>آخرین بروزرسانی:</b> <code>${new Date().toLocaleString(
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
                  {
                    text: "📊 وضعیت TRX",
                    callback_data: "admin_trx_scan_status",
                  },
                ],
                [
                  {
                    text: "💰 گزارش مالی",
                    callback_data: "admin_financial_report",
                  },
                  {
                    text: "📈 نمودار سود",
                    callback_data: "admin_profit_chart",
                  },
                ],
                [{ text: "🏠 بازگشت", callback_data: "admin_back_to_panel" }],
              ],
            },
          });
        } else {
          await bot.editMessageText(
            `❌ <b>خطا در دریافت وضعیت</b>\n\n` +
              `🔍 <b>جزئیات خطا:</b>\n` +
              `• پیام: <code>${statusData.error || "خطای نامشخص"}</code>\n` +
              `• کد: <code>${statusData.status || "نامشخص"}</code>\n\n` +
              `💡 <b>راه‌حل:</b>\n` +
              `• بررسی اتصال اینترنت\n` +
              `• بررسی API key\n` +
              `• تلاش مجدد`,
            {
              chat_id: chatId,
              message_id: messageId,
              parse_mode: "HTML",
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: "🔄 تلاش مجدد", callback_data: "admin_status" },
                    { text: "🏠 بازگشت", callback_data: "admin_back_to_panel" },
                  ],
                ],
              },
            }
          );
        }
      } catch (error) {
        console.error("❌ Error in admin status:", error.message);

        await bot.editMessageText(
          `❌ <b>خطا در دریافت وضعیت</b>\n\n` +
            `🔍 <b>جزئیات خطا:</b>\n` +
            `• پیام: <code>${error.message}</code>\n` +
            `• نوع: <code>${error.name || "نامشخص"}</code>\n\n` +
            `💡 <b>راه‌حل:</b>\n` +
            `• بررسی اتصال اینترنت\n` +
            `• بررسی فایل‌های API\n` +
            `• تلاش مجدد`,
          {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [
                  { text: "🔄 تلاش مجدد", callback_data: "admin_status" },
                  { text: "🏠 بازگشت", callback_data: "admin_back_to_panel" },
                ],
              ],
            },
          }
        );
      }
      break;
    }
    case "admin_detailed_financial": {
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

      await detailedFinancialReport(bot, query, session);
      break;
    }
    case "admin_bank_report": {
      // بررسی دسترسی ادمین
      const groupId = process.env.GROUP_ID;
      const adminIds = (process.env.ADMINS || "")
        .split(",")
        .filter(Boolean)
        .map((id) => Number(id.trim()));

      // اگر GROUP_ID تعریف نشده، اجازه دسترسی بده
      if (groupId && chatId.toString() !== String(groupId)) {
        await bot.answerCallbackQuery(query.id, {
          text: "⛔️ این عملیات فقط در گروه ادمین قابل انجام است",
          show_alert: true,
        });
        break;
      }

      // اگر ADMINS تعریف نشده، اجازه دسترسی بده
      if (adminIds.length > 0 && !adminIds.includes(Number(userId))) {
        await bot.answerCallbackQuery(query.id, {
          text: "⛔️ شما دسترسی انجام این عملیات را ندارید",
          show_alert: true,
        });
        break;
      }

      console.log("🔍 Calling bankReport...");
      await bankReport(bot, query, session);
      break;
    }
    case "admin_users_report": {
      // بررسی دسترسی ادمین
      const groupId = process.env.GROUP_ID;
      const adminIds = (process.env.ADMINS || "")
        .split(",")
        .filter(Boolean)
        .map((id) => Number(id.trim()));

      // اگر GROUP_ID تعریف نشده، اجازه دسترسی بده
      if (groupId && chatId.toString() !== String(groupId)) {
        await bot.answerCallbackQuery(query.id, {
          text: "⛔️ این عملیات فقط در گروه ادمین قابل انجام است",
          show_alert: true,
        });
        break;
      }

      // اگر ADMINS تعریف نشده، اجازه دسترسی بده
      if (adminIds.length > 0 && !adminIds.includes(Number(userId))) {
        await bot.answerCallbackQuery(query.id, {
          text: "⛔️ شما دسترسی انجام این عملیات را ندارید",
          show_alert: true,
        });
        break;
      }

      console.log("🔍 Calling usersReport...");
      await usersReport(bot, query, session);
      break;
    }
    case "admin_monthly_report": {
      // بررسی دسترسی ادمین
      const groupId = process.env.GROUP_ID;
      const adminIds = (process.env.ADMINS || "")
        .split(",")
        .filter(Boolean)
        .map((id) => Number(id.trim()));

      // اگر GROUP_ID تعریف نشده، اجازه دسترسی بده
      if (groupId && chatId.toString() !== String(groupId)) {
        await bot.answerCallbackQuery(query.id, {
          text: "⛔️ این عملیات فقط در گروه ادمین قابل انجام است",
          show_alert: true,
        });
        break;
      }

      // اگر ADMINS تعریف نشده، اجازه دسترسی بده
      if (adminIds.length > 0 && !adminIds.includes(Number(userId))) {
        await bot.answerCallbackQuery(query.id, {
          text: "⛔️ شما دسترسی انجام این عملیات را ندارید",
          show_alert: true,
        });
        break;
      }

      console.log("🔍 Calling monthlyReport...");
      await monthlyReport(bot, query, session);
      break;
    }
    case "admin_profit_chart": {
      // بررسی دسترسی ادمین
      const groupId = process.env.GROUP_ID;
      const adminIds = (process.env.ADMINS || "")
        .split(",")
        .filter(Boolean)
        .map((id) => Number(id.trim()));

      // اگر GROUP_ID تعریف نشده، اجازه دسترسی بده
      if (groupId && chatId.toString() !== String(groupId)) {
        await bot.answerCallbackQuery(query.id, {
          text: "⛔️ این عملیات فقط در گروه ادمین قابل انجام است",
          show_alert: true,
        });
        break;
      }

      // اگر ADMINS تعریف نشده، اجازه دسترسی بده
      if (adminIds.length > 0 && !adminIds.includes(Number(userId))) {
        await bot.answerCallbackQuery(query.id, {
          text: "⛔️ شما دسترسی انجام این عملیات را ندارید",
          show_alert: true,
        });
        break;
      }

      console.log("🔍 Calling profitChart...");
      await profitChart(bot, query, session);
      break;
    }
    case "admin_crypto_report": {
      // بررسی دسترسی ادمین
      const groupId = process.env.GROUP_ID;
      const adminIds = (process.env.ADMINS || "")
        .split(",")
        .filter(Boolean)
        .map((id) => Number(id.trim()));

      // اگر GROUP_ID تعریف نشده، اجازه دسترسی بده
      if (groupId && chatId.toString() !== String(groupId)) {
        await bot.answerCallbackQuery(query.id, {
          text: "⛔️ این عملیات فقط در گروه ادمین قابل انجام است",
          show_alert: true,
        });
        break;
      }

      // اگر ADMINS تعریف نشده، اجازه دسترسی بده
      if (adminIds.length > 0 && !adminIds.includes(Number(userId))) {
        await bot.answerCallbackQuery(query.id, {
          text: "⛔️ شما دسترسی انجام این عملیات را ندارید",
          show_alert: true,
        });
        break;
      }

      console.log("🔍 Calling cryptoReport...");
      await cryptoReport(bot, query, session);
      break;
    }
    case "admin_back_to_panel": {
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

      // پاک کردن session برای خروج از حالت‌های مختلف
      await clearSession(chatId);

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
            [
              {
                text: "💰 گزارش مالی",
                callback_data: "admin_financial_report",
              },
              {
                text: "📨 ارسال پیام به کاربر",
                callback_data: "admin_send_message_to_user",
              },
            ],
          ],
        },
      });
      break;
    }
    case "admin_send_message_to_user": {
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

      // تنظیم session برای دریافت آیدی کاربر
      await setSession(chatId, {
        step: "admin_waiting_for_user_id",
        action: "send_message_to_user",
        messageId: messageId, // اضافه کردن messageId به session
      });

      await bot.editMessageText(
        "📨 <b>ارسال پیام به کاربر</b>\n\n" +
          "🔢 لطفاً <b>آیدی عددی</b> کاربر را وارد کنید:\n\n" +
          "💡 <b>نکته:</b> آیدی عددی را می‌توانید از پروفایل کاربر یا پیام‌های قبلی دریافت کنید.",
        {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [{ text: "🏠 بازگشت", callback_data: "admin_back_to_panel" }],
            ],
          },
        }
      );
      break;
    }
    case "confirm_payment":
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
  }

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

    console.log("🔍 Debug - send_config_to_user callback triggered");
    console.log(
      "🔍 Debug - userId from callback:",
      userId,
      "type:",
      typeof userId
    );
    console.log("🔍 Debug - chatId:", chatId, "type:", typeof chatId);

    const sentMsg = await bot.sendMessage(
      chatId,
      "📝 لطفاً کانفیگ سرویس را ارسال کنید:",
      {
        reply_markup: {
          inline_keyboard: [],
        },
      }
    );

    const sessionData = {
      step: "waiting_for_config_details",
      targetUserId: userId,
      messageId: sentMsg.message_id,
    };

    console.log("🔍 Debug - setting session data:", sessionData);
    await setSession(chatId, sessionData);

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
