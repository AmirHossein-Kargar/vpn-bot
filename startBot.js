import { createClient } from "redis";
import connectDB from "./config/db.js";
import TelegramBot from "node-telegram-bot-api";

export default async function startBot() {
  await connectDB();
  console.log("✅ DB Ready");
  const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
  return bot;
}
