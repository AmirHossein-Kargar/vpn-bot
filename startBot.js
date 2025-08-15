import connectDB from "./config/db.js";
import TelegramBot from "node-telegram-bot-api";
import trxScanner from "./services/trxWalletScanner.js";

export default async function startBot() {
  await connectDB();
  console.log("\x1b[32m%s\x1b[0m", "✔ DB Ready");

  const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

  // راه‌اندازی سرویس اسکن کیف پول TRX
  try {
    // اتصال bot instance به سرویس اسکن
    trxScanner.setBotInstance(bot);

    // شروع اسکن خودکار
    trxScanner.startAutoScan();
    console.log("\x1b[32m%s\x1b[0m", "🚀 TRX Wallet Scanner Started");
  } catch (error) {
    console.error(
      "\x1b[31m%s\x1b[0m",
      "❌ Failed to start TRX Wallet Scanner:",
      error.message
    );
  }

  return bot;
}
