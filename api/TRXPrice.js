import "dotenv/config";
import axios from "axios";

export async function TRXPrice() {
  const apiKey = process.env.CMC_API_KEY;

  // Check if API key exists
  if (!apiKey) {
    return 0.08; // Fallback price
  }

  const url =
    "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=TRX&convert=USD";

  try {
    const res = await axios.get(url, {
      headers: {
        Accept: "application/json",
        "X-CMC_PRO_API_KEY": apiKey,
      },
    });

    const price = res.data.data.TRX.quote.USD.price;
    return price;
  } catch (error) {
    return 0.08; // Fallback price
  }
}
