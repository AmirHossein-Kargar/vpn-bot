const axios = require("axios");

async function getTetherRate() {
  const URL = "https://api.tetherland.com/currencies";
  try {
    const { data } = await axios.get(URL);
    const usdtData = data?.data?.currencies?.USDT;

    if (!usdtData) {
      throw new Error("USDT data not found in response");
    }
    return usdtData.price;
  } catch (error) {
    console.log("❌ Error fetching Tether rate:", error.message);
    throw error;
  }
}
module.exports = getTetherRate;
