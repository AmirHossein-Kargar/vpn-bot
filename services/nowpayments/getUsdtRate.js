const axios = require("axios");

async function getUsdtRate() {
  try {
    const response = await axios.get("https://api.tetherland.com/currencies");
    const usdtPrice = response?.data?.data?.currencies?.USDT?.price;

    if (!usdtPrice) {
      throw new Error("USDT price not found in response");
    }

    console.log(`✅ USDT Rate: ${usdtPrice} IRR`);
    return Number(usdtPrice);
  } catch (error) {
    console.log("❌ Error fetching USDT rate:", error);
  }
}
module.exports = getUsdtRate;
