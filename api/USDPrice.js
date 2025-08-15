import axios from "axios";

export async function USDPrice() {
  try {
    const url = "https://api.tetherland.com/currencies";

    console.log("🔄 Fetching USD price from Tetherland...");

    const response = await axios.get(url);

    // Check if response has the expected structure
    if (!response.data?.data?.currencies?.USDT?.price) {
      throw new Error("Invalid response structure from API");
    }

    const usdtPrice = response.data.data.currencies.USDT.price;

    console.log("✅ USD price fetched successfully:", usdtPrice);
    return usdtPrice;
  } catch (error) {
    console.error("❌ Error fetching USD price:", error.message);

    // Return a fallback price if API fails
    console.log("⚠️ Using fallback USD price: 1 USD = 100,000 Toman");
    return 100000; // Fallback rate
  }
}