import axios from "axios";
import CryptoInvoice from "../models/CryptoInvoice.js";
import { getSession } from "../config/sessionStore.js";
import mongoose from "mongoose"; // Added for database connection check

class TRXWalletScanner {
  constructor() {
    this.walletAddress = process.env.TRX_WALLET;
    this.scanInterval = null;
    this.isScanning = false;
    this.testMode = false; // حالت تست
    this.botInstance = null; // برای ارسال پیام به کاربران
    this.scanCount = 0; // تعداد اسکن‌های انجام شده
    this.lastScanTime = null; // زمان آخرین اسکن
    this.startTime = Date.now(); // زمان شروع اسکنر
    this.databaseConnected = false; // وضعیت اتصال دیتابیس
    this.tronScanConnected = false; // وضعیت اتصال TronScan API
  }

  // تنظیم instance bot برای ارسال پیام
  setBotInstance(bot) {
    this.botInstance = bot;
    console.log("🤖 Bot instance set for TRX scanner");
  }

  // فعال‌سازی حالت تست
  enableTestMode() {
    this.testMode = true;
    console.log("🧪 Test mode enabled - Using mock data");
  }

  // غیرفعال‌سازی حالت تست
  disableTestMode() {
    this.testMode = false;
    console.log("🚀 Test mode disabled - Using real API");
  }

  // بررسی وضعیت اتصال دیتابیس
  async checkDatabaseConnection() {
    try {
      if (mongoose.connection && mongoose.connection.readyState === 1) {
        this.databaseConnected = true;
        return true;
      } else {
        this.databaseConnected = false;
        return false;
      }
    } catch (error) {
      this.databaseConnected = false;
      return false;
    }
  }

  // بررسی وضعیت اتصال TronScan API
  async checkTronScanConnection() {
    try {
      // تست ساده با درخواست به API
      const testUrl = `https://apilist.tronscanapi.com/api/account?address=${this.walletAddress}`;
      const response = await axios.get(testUrl, { timeout: 10000 }); // 10 ثانیه timeout

      if (response.status === 200) {
        this.tronScanConnected = true;
        return true;
      } else {
        this.tronScanConnected = false;
        return false;
      }
    } catch (error) {
      this.tronScanConnected = false;
      return false;
    }
  }

  // شروع اسکن خودکار
  startAutoScan() {
    if (this.scanInterval) {
      console.log("🔄 TRX wallet scanner is already running");
      return;
    }

    console.log("🚀 Starting TRX wallet scanner...");
    this.scanInterval = setInterval(() => {
      this.scanWallet();
    }, 5 * 60 * 1000); // هر 5 دقیقه

    // اجرای اولیه
    this.scanWallet();
  }

  // توقف اسکن خودکار
  stopAutoScan() {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
      console.log("⏹️ TRX wallet scanner stopped");
    }
  }

  // اسکن کیف پول
  async scanWallet() {
    if (this.isScanning) {
      console.log("⏳ TRX wallet scan already in progress, skipping...");
      return;
    }

    this.isScanning = true;
    this.scanCount++;
    this.lastScanTime = Date.now();

    // بررسی وضعیت اتصال دیتابیس و TronScan API
    await this.checkDatabaseConnection();
    await this.checkTronScanConnection();

    console.log("🔍 Scanning TRX wallet for new transactions...");

    try {
      // دریافت موجودی ولت
      const walletBalance = this.testMode
        ? 100.0
        : await this.fetchWalletBalance();

      // دریافت تراکنش‌ها (واقعی یا تست)
      const transactions = this.testMode
        ? await this.getMockTransactions()
        : await this.fetchTransactions();

      if (!transactions || transactions.length === 0) {
        console.log("📭 No transactions found");
        this.isScanning = false;
        return {
          totalTransactions: 0,
          processedTransactions: 0,
          matchedInvoices: 0,
          confirmedInvoices: 0,
          rejectedInvoices: 0,
          pendingMatches: 0,
          matchedInvoiceDetails: [],
          recentTransactions: [],
          totalBalance: walletBalance,
        };
      }

      console.log(`📊 Found ${transactions.length} incoming TRX transactions`);

      // نمایش جزئیات تراکنش‌ها
      if (transactions.length > 0) {
        console.log("📋 Transaction details:");
        transactions.forEach((tx, index) => {
          const amount = parseFloat(tx.amount) / 1000000;
          const status =
            tx.confirmed && tx.contractRet === "SUCCESS"
              ? "✅ Confirmed"
              : tx.revert
              ? "❌ Reverted"
              : "⏳ Pending";
          console.log(
            `  ${
              index + 1
            }. ${amount} TRX - ${status} - Hash: ${tx.hash.substring(0, 10)}...`
          );
        });
      }

      // آمار خلاصه
      const summary = {
        totalTransactions: transactions.length,
        processedTransactions: 0,
        matchedInvoices: 0,
        confirmedInvoices: 0,
        rejectedInvoices: 0,
        pendingMatches: 0,
        matchedInvoiceDetails: [], // {invoiceId, amount, cryptoAmount}
        recentTransactions: transactions, // تراکنش‌های اخیر
        totalBalance: walletBalance, // موجودی کل ولت
      };

      // بررسی هر تراکنش
      for (const tx of transactions) {
        const result = await this.processTransaction(tx);
        if (!result) continue;
        if (result.processed) summary.processedTransactions += 1;
        summary.matchedInvoices += result.matchedCount || 0;
        summary.confirmedInvoices += result.confirmedCount || 0;
        summary.rejectedInvoices += result.rejectedCount || 0;
        summary.pendingMatches += result.pendingCount || 0;
        if (Array.isArray(result.matchedInvoiceDetails)) {
          summary.matchedInvoiceDetails.push(...result.matchedInvoiceDetails);
        }
      }

      return summary;
    } catch (error) {
      console.error("❌ Error scanning TRX wallet:", error.message);
      return {
        totalTransactions: 0,
        processedTransactions: 0,
        matchedInvoices: 0,
        confirmedInvoices: 0,
        rejectedInvoices: 0,
        pendingMatches: 0,
        matchedInvoiceDetails: [],
        recentTransactions: [],
        totalBalance: 0,
        error: error.message,
      };
    } finally {
      this.isScanning = false;
    }
  }

  // دریافت تراکنش‌های Mock برای تست
  async getMockTransactions() {
    console.log("🧪 Using mock transactions for testing...");

    // ایجاد تراکنش‌های تست با مبالغ مختلف
    const mockTransactions = [
      {
        hash: "mock_hash_001",
        contractType: 1,
        tokenInfo: { tokenAbbr: "trx" },
        toAddress: this.walletAddress,
        amount: "3043114", // 3.043114 TRX (مطابق با فاکتور تست)
        confirmed: true,
        contractRet: "SUCCESS",
        revert: false,
      },
      {
        hash: "mock_hash_002",
        contractType: 1,
        tokenInfo: { tokenAbbr: "trx" },
        toAddress: this.walletAddress,
        amount: "5000000", // 5.0 TRX (مبلغ جدید)
        confirmed: true,
        contractRet: "SUCCESS",
        revert: false,
      },
      {
        hash: "mock_hash_003",
        contractType: 1,
        tokenInfo: { tokenAbbr: "trx" },
        toAddress: this.walletAddress,
        amount: "1000000", // 1.0 TRX (مبلغ کوچک)
        confirmed: false,
        contractRet: "PENDING",
        revert: false,
      },
    ];

    return mockTransactions;
  }

  // دریافت موجودی ولت از TronScan API
  async fetchWalletBalance() {
    try {
      const url = `https://apilist.tronscanapi.com/api/account/tokens`;
      const params = {
        address: this.walletAddress,
        start: 0,
        limit: 100,
      };

      const response = await axios.get(url, { params });

      if (response.data && response.data.data) {
        // پیدا کردن TRX balance
        const trxToken = response.data.data.find(
          (token) => token.tokenAbbr === "trx" || token.tokenId === "_"
        );

        if (trxToken) {
          const balance =
            parseFloat(trxToken.balance) /
            Math.pow(10, trxToken.tokenDecimal || 6);
          return balance;
        }
      }

      // Fallback: try to get balance from account info
      try {
        const accountUrl = `https://apilist.tronscanapi.com/api/account?address=${this.walletAddress}`;
        const accountResponse = await axios.get(accountUrl);

        if (accountResponse.data && accountResponse.data.balance) {
          const fallbackBalance =
            parseFloat(accountResponse.data.balance) / 1000000;
          return fallbackBalance;
        }
      } catch (fallbackError) {
        // Fallback failed, continue to default
      }

      return 0;
    } catch (error) {
      return 0;
    }
  }

  // دریافت تراکنش‌ها از TronScan API
  async fetchTransactions() {
    try {
      const url = `https://apilist.tronscanapi.com/api/transaction`;
      const params = {
        sort: "-timestamp",
        count: true,
        limit: 20, // کاهش محدودیت برای نمایش تعداد واقعی تراکنش‌ها
        start: 0,
        address: this.walletAddress,
      };

      const response = await axios.get(url, { params });

      if (response.data && response.data.data) {
        // فیلتر کردن فقط تراکنش‌های ورودی (incoming) به کیف پول
        const incomingTransactions = response.data.data.filter(
          (tx) =>
            tx.toAddress === this.walletAddress &&
            tx.contractType === 1 &&
            tx.tokenInfo?.tokenAbbr === "trx"
        );

        return incomingTransactions;
      }

      return [];
    } catch (error) {
      console.error("❌ Error fetching transactions:", error.message);
      return [];
    }
  }

  // پردازش یک تراکنش
  async processTransaction(tx) {
    try {
      // بررسی اینکه آیا این تراکنش TRX است
      if (tx.contractType !== 1 || tx.tokenInfo?.tokenAbbr !== "trx") {
        return {
          processed: false,
          matchedCount: 0,
          confirmedCount: 0,
          rejectedCount: 0,
          pendingCount: 0,
          matchedInvoiceDetails: [],
        }; // فقط تراکنش‌های TRX
      }

      // بررسی اینکه آیا تراکنش به کیف پول ما ارسال شده
      if (tx.toAddress !== this.walletAddress) {
        return {
          processed: false,
          matchedCount: 0,
          confirmedCount: 0,
          rejectedCount: 0,
          pendingCount: 0,
          matchedInvoiceDetails: [],
        };
      }

      // تبدیل مبلغ از string به number (TRX با 6 رقم اعشار)
      const txAmount = parseFloat(tx.amount) / 1000000;

      console.log(`💸 Found incoming TRX transaction: ${txAmount} TRX`);

      // جستجوی فاکتورهای pending که با این مبلغ مطابقت دارند
      const matchingInvoices = await this.findMatchingInvoices(txAmount);

      if (matchingInvoices.length > 0) {
        console.log(`✅ Found ${matchingInvoices.length} matching invoice(s)`);

        for (const invoice of matchingInvoices) {
          await this.processMatchedInvoice(invoice, tx);
        }

        const confirmedCount =
          tx.confirmed && tx.contractRet === "SUCCESS"
            ? matchingInvoices.length
            : 0;
        const rejectedCount = tx.revert ? matchingInvoices.length : 0;
        const pendingCount =
          !confirmedCount && !rejectedCount ? matchingInvoices.length : 0;

        return {
          processed: true,
          matchedCount: matchingInvoices.length,
          confirmedCount,
          rejectedCount,
          pendingCount,
          matchedInvoiceDetails: matchingInvoices.map((inv) => ({
            invoiceId: inv.invoiceId,
            amount: inv.amount,
            cryptoAmount: inv.cryptoAmount,
          })),
        };
      } else {
        console.log(`❌ No matching invoice found for amount: ${txAmount} TRX`);
        return {
          processed: true,
          matchedCount: 0,
          confirmedCount: 0,
          rejectedCount: 0,
          pendingCount: 0,
          matchedInvoiceDetails: [],
        };
      }
    } catch (error) {
      console.error("❌ Error processing transaction:", error.message);
      return {
        processed: false,
        matchedCount: 0,
        confirmedCount: 0,
        rejectedCount: 0,
        pendingCount: 0,
        matchedInvoiceDetails: [],
      };
    }
  }

  // یافتن فاکتورهای مطابق
  async findMatchingInvoices(txAmount) {
    try {
      // بررسی اتصال دیتابیس
      if (!mongoose.connection || mongoose.connection.readyState !== 1) {
        console.log("⚠️ Database not connected, skipping invoice search");
        return [];
      }

      // جستجوی فاکتورهای pending با مبلغ مشابه (با tolerance)
      const tolerance = 0.01; // 1% tolerance

      const invoices = await CryptoInvoice.find({
        status: "unpaid",
        paymentType: "trx",
        currency: "TRX",
      }).maxTimeMS(5000); // کاهش timeout به 5 ثانیه

      console.log(
        `🔍 Found ${invoices.length} unpaid TRX invoices in database`
      );

      return invoices.filter((invoice) => {
        const difference = Math.abs(invoice.cryptoAmount - txAmount);
        const percentage = difference / invoice.cryptoAmount;
        const isMatch = percentage <= tolerance;

        if (isMatch) {
          console.log(
            `🎯 Match found: Invoice ${invoice.invoiceId} (${invoice.cryptoAmount} TRX) matches transaction (${txAmount} TRX)`
          );
        }

        return isMatch;
      });
    } catch (error) {
      console.error("❌ Error finding matching invoices:", error.message);
      return [];
    }
  }

  // پردازش فاکتور مطابق
  async processMatchedInvoice(invoice, tx) {
    try {
      console.log(`🎯 Processing matched invoice: ${invoice.invoiceId}`);

      // بررسی وضعیت تراکنش
      if (tx.confirmed && tx.contractRet === "SUCCESS") {
        // تایید فاکتور
        await this.confirmInvoice(invoice, tx);
      } else if (tx.revert) {
        // رد فاکتور
        await this.rejectInvoice(invoice, tx);
      } else {
        console.log(`⏳ Transaction ${tx.hash} is pending confirmation`);
      }
    } catch (error) {
      console.error("❌ Error processing matched invoice:", error.message);
    }
  }

  // تایید فاکتور
  async confirmInvoice(invoice, tx) {
    try {
      // به‌روزرسانی وضعیت فاکتور
      await CryptoInvoice.findByIdAndUpdate(invoice._id, {
        status: "paid",
        // اضافه کردن اطلاعات تراکنش برای رکورد
        transactionHash: tx.hash,
        confirmedAt: new Date(),
      });

      console.log(`✅ Invoice ${invoice.invoiceId} confirmed successfully`);

      // ارسال پیام تایید به کاربر
      await this.sendPaymentConfirmation(invoice, tx);
    } catch (error) {
      console.error("❌ Error confirming invoice:", error.message);
    }
  }

  // ارسال پیام تایید پرداخت به کاربر
  async sendPaymentConfirmation(invoice, tx) {
    try {
      if (!this.botInstance) {
        console.log("⚠️ Bot instance not available, skipping message send");
        return;
      }

      const userId = invoice.userId;
      const amount = invoice.amount;
      const cryptoAmount = invoice.cryptoAmount;
      const transactionHash = tx.hash;

      // حذف پیام قبلی که شامل آدرس ولت بوده (اگر در session ذخیره شده)
      const { getSession } = await import("../config/sessionStore.js");
      const session = await getSession(userId);

      if (session?.walletMessageId) {
        try {
          await this.botInstance.deleteMessage(userId, session.walletMessageId);
          console.log(`🗑️ Deleted previous wallet message for user ${userId}`);
        } catch (deleteError) {
          console.log(
            `⚠️ Could not delete previous wallet message: ${deleteError.message}`
          );
        }
      }

      const confirmationMessage = `🎉 <b>پرداخت شما تایید شد!</b>

✅ <b>فاکتور:</b> <code>${invoice.invoiceId}</code>
💰 <b>مبلغ:</b> <code>${amount.toLocaleString()}</code> تومان
🪙 <b>مبلغ TRX:</b> <code>${cryptoAmount.toFixed(6)}</code> TRX
🔗 <b>هش تراکنش:</b> <code>${transactionHash}</code>

🎯 <b>وضعیت:</b> تایید شده
⏰ <b>زمان تایید:</b> ${new Date().toLocaleString("fa-IR")}

💳 <b>موجودی کیف پول شما شارژ شد.</b>

🎊 <b>از اعتماد شما متشکریم!</b>`;

      // ارسال پیام تایید
      await this.botInstance.sendMessage(userId, confirmationMessage, {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🏠 بازگشت به منوی اصلی",
                callback_data: "back_to_home",
              },
            ],
          ],
        },
      });

      console.log(`📱 Payment confirmation sent to user ${userId}`);

      // شارژ کردن کیف پول کاربر
      await this.creditUserWallet(invoice);
    } catch (error) {
      console.error("❌ Error sending payment confirmation:", error.message);
    }
  }

  // شارژ کردن کیف پول کاربر
  async creditUserWallet(invoice) {
    try {
      console.log(
        `💳 Crediting wallet for user ${invoice.userId} with ${invoice.amount} Toman`
      );

      const User = (await import("../models/User.js")).default;

      const updatedUser = await User.findOneAndUpdate(
        { telegramId: invoice.userId.toString() },
        {
          $inc: {
            balance: invoice.amount,
            successfulPayments: 1,
          },
        },
        { new: true }
      );

      if (updatedUser) {
        console.log(
          `✅ Wallet credited successfully for user ${invoice.userId}`
        );
        console.log(`💰 New balance: ${updatedUser.balance} Toman`);
        console.log(
          `📊 Total successful payments: ${updatedUser.successfulPayments}`
        );
      } else {
        console.log(`⚠️ User ${invoice.userId} not found for wallet credit`);
      }
    } catch (error) {
      console.error("❌ Error crediting user wallet:", error.message);
    }
  }

  // رد فاکتور
  async rejectInvoice(invoice, tx) {
    try {
      await CryptoInvoice.findByIdAndUpdate(invoice._id, {
        status: "rejected",
        transactionHash: tx.hash,
        rejectedAt: new Date(),
      });

      console.log(
        `❌ Invoice ${invoice.invoiceId} rejected due to transaction revert`
      );

      // ارسال پیام رد به کاربر
      await this.sendPaymentRejection(invoice, tx);
    } catch (error) {
      console.error("❌ Error rejecting invoice:", error.message);
    }
  }

  // ارسال پیام رد پرداخت به کاربر
  async sendPaymentRejection(invoice, tx) {
    try {
      if (!this.botInstance) {
        console.log(
          "⚠️ Bot instance not available, skipping rejection message"
        );
        return;
      }

      const userId = invoice.userId;

      const { getSession } = await import("../config/sessionStore.js");
      const session = await getSession(userId);

      if (session?.walletMessageId) {
        try {
          await this.botInstance.deleteMessage(userId, session.walletMessageId);
          console.log(`🗑️ Deleted previous wallet message for user ${userId}`);
        } catch (deleteError) {
          console.log(
            `⚠️ Could not delete previous wallet message: ${deleteError.message}`
          );
        }
      }

      const rejectionMessage = `❌ <b>پرداخت شما رد شد!</b>

🚫 <b>فاکتور:</b> <code>${invoice.invoiceId}</code>
💰 <b>مبلغ:</b> <code>${invoice.amount.toLocaleString()}</code> تومان
🔗 <b>هش تراکنش:</b> <code>${tx.hash}</code>

⚠️ <b>دلیل:</b> تراکنش ناموفق یا revert شده

🔄 <b>لطفاً دوباره تلاش کنید یا از روش‌های دیگر پرداخت استفاده کنید.</b>`;

      await this.botInstance.sendMessage(userId, rejectionMessage, {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🔄 تلاش مجدد",
                callback_data: "back_to_topup",
              },
              {
                text: "🏠 بازگشت به منوی اصلی",
                callback_data: "back_to_home",
              },
            ],
          ],
        },
      });

      console.log(`📱 Payment rejection sent to user ${userId}`);
    } catch (error) {
      console.error("❌ Error sending payment rejection:", error.message);
    }
  }

  // اسکن دستی برای تست
  async manualScan() {
    console.log("🔍 Manual TRX wallet scan initiated...");
    const summary = await this.scanWallet();
    return summary;
  }

  // بررسی دستی وضعیت اتصال TronScan API
  async checkTronScanStatus() {
    console.log("🔍 Manual TronScan API status check...");
    const isConnected = await this.checkTronScanConnection();
    return {
      connected: isConnected,
      walletAddress: this.walletAddress,
      timestamp: new Date().toISOString(),
    };
  }

  // تست کامل سیستم
  async runFullTest() {
    console.log("🧪 Running full system test...");

    try {
      // فعال‌سازی حالت تست
      this.enableTestMode();

      // اجرای اسکن
      await this.scanWallet();

      // نمایش نتایج
      await this.showTestResults();

      console.log("✅ Full test completed successfully");
    } catch (error) {
      console.error("❌ Full test failed:", error.message);
    } finally {
      // غیرفعال‌سازی حالت تست
      this.disableTestMode();
    }
  }

  // ماک تست برای تایید تراکنش
  async mockConfirmTransaction(userId, invoiceId) {
    try {
      console.log(
        `🧪 Mock confirming transaction for user ${userId}, invoice ${invoiceId}`
      );

      const invoice = await CryptoInvoice.findOne({
        invoiceId: invoiceId,
        userId: userId,
      });

      if (!invoice) {
        console.log(`❌ Invoice ${invoiceId} not found for user ${userId}`);
        return false;
      }

      const mockTx = {
        hash: `mock_confirm_${Date.now()}`,
        confirmed: true,
        contractRet: "SUCCESS",
        revert: false,
      };

      await this.confirmInvoice(invoice, mockTx);
      console.log(`✅ Mock transaction confirmed for user ${userId}`);
      return true;
    } catch (error) {
      console.error("❌ Error in mock confirm transaction:", error.message);
      return false;
    }
  }

  // ماک تست برای رد تراکنش
  async mockRejectTransaction(userId, invoiceId) {
    try {
      console.log(
        `🧪 Mock rejecting transaction for user ${userId}, invoice ${invoiceId}`
      );

      const invoice = await CryptoInvoice.findOne({
        invoiceId: invoiceId,
        userId: userId,
      });

      if (!invoice) {
        console.log(`❌ Invoice ${invoiceId} not found for user ${userId}`);
        return false;
      }

      const mockTx = {
        hash: `mock_reject_${Date.now()}`,
        confirmed: false,
        contractRet: "REVERT",
        revert: true,
      };

      await this.rejectInvoice(invoice, mockTx);
      console.log(`❌ Mock transaction rejected for user ${userId}`);
      return true;
    } catch (error) {
      console.error("❌ Error in mock reject transaction:", error.message);
      return false;
    }
  }

  // تست خودکار با تایید تصادفی
  async runAutoMockTest() {
    console.log("🎲 Running auto mock test with random confirmations...");

    try {
      this.enableTestMode();

      const pendingInvoices = await CryptoInvoice.find({
        status: "unpaid",
        paymentType: "trx",
      });

      if (pendingInvoices.length === 0) {
        console.log("📭 No pending invoices found for testing");
        return;
      }

      console.log(
        `📊 Found ${pendingInvoices.length} pending invoices for testing`
      );

      for (const invoice of pendingInvoices) {
        const shouldConfirm = Math.random() > 0.3; // 70% chance of confirmation

        if (shouldConfirm) {
          await this.mockConfirmTransaction(invoice.userId, invoice.invoiceId);
        } else {
          await this.mockRejectTransaction(invoice.userId, invoice.invoiceId);
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      console.log("✅ Auto mock test completed");
    } catch (error) {
      console.error("❌ Auto mock test failed:", error.message);
    } finally {
      this.disableTestMode();
    }
  }

  // نمایش نتایج تست
  async showTestResults() {
    try {
      // بررسی اتصال دیتابیس
      if (!mongoose.connection || mongoose.connection.readyState !== 1) {
        console.log("⚠️ Database not connected, cannot show test results");
        return;
      }

      console.log("\n📊 Test Results:");
      console.log("==================");

      const allInvoices = await CryptoInvoice.find({
        paymentType: "trx",
      }).maxTimeMS(5000);

      console.log(`Total TRX invoices: ${allInvoices.length}`);

      const unpaid = allInvoices.filter(
        (inv) => inv.status === "unpaid"
      ).length;
      const paid = allInvoices.filter((inv) => inv.status === "paid").length;
      const rejected = allInvoices.filter(
        (inv) => inv.status === "rejected"
      ).length;

      console.log(`Unpaid: ${unpaid}`);
      console.log(`Paid: ${paid}`);
      console.log(`Rejected: ${rejected}`);

      // نمایش جزئیات فاکتورهای تایید شده
      const paidInvoices = allInvoices.filter((inv) => inv.status === "paid");
      if (paidInvoices.length > 0) {
        console.log("\n✅ Confirmed Invoices:");
        paidInvoices.forEach((inv) => {
          console.log(
            `- ${inv.invoiceId}: ${
              inv.cryptoAmount
            } TRX (${inv.amount.toLocaleString()} Toman)`
          );
        });
      }

      // نمایش جزئیات فاکتورهای pending
      const unpaidInvoices = allInvoices.filter(
        (inv) => inv.status === "unpaid"
      );
      if (unpaidInvoices.length > 0) {
        console.log("\n⏳ Pending Invoices:");
        unpaidInvoices.forEach((inv) => {
          console.log(
            `- ${inv.invoiceId}: ${
              inv.cryptoAmount
            } TRX (${inv.amount.toLocaleString()} Toman)`
          );
        });
      }
    } catch (error) {
      console.error("❌ Error showing test results:", error.message);
    }
  }
}

// ایجاد instance
const trxScanner = new TRXWalletScanner();

export default trxScanner;
