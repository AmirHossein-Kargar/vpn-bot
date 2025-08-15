import "dotenv/config";
import axios from "axios";

export async function TRXPrice() {
  const apiKey = process.env.CMC_API_KEY;

  // Check if API key exists
  if (!apiKey) {
    console.error("❌ CMC_API_KEY not found in environment variables");
    return null;
  }

  const url =
    "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=TRX&convert=USD";

  try {
    console.log("🔄 Fetching TRX price from CoinMarketCap...");
    console.log("🔑 API Key loaded:", apiKey.substring(0, 8) + "...");

    const res = await axios.get(url, {
      headers: {
        Accept: "application/json",
        "X-CMC_PRO_API_KEY": apiKey,
      },
    });

    const price = res.data.data.TRX.quote.USD.price;
    console.log("✅ TRX price fetched successfully:", price);
    return price;
  } catch (error) {
    console.error("❌ Error fetching TRX price:", error.message);

    if (error.response?.status === 401) {
      console.error("🔑 401 Unauthorized - Check your API key");
    } else if (error.response?.status === 429) {
      console.error("⏰ 429 Rate limit exceeded - Try again later");
    }

    return null;
  }
}