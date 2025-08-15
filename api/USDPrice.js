import axios from "axios";

export async function USDPrice() {
  try {
    const url = "https://api.tetherland.com/currencies";

    const response = await axios.get(url);

    // Check if response has the expected structure
    if (!response.data?.data?.currencies?.USDT?.price) {
      throw new Error("Invalid response structure from API");
    }

    const usdtPrice = response.data.data.currencies.USDT.price;

    return usdtPrice;
  } catch (error) {
    // Return a fallback price if API fails
    return 100000; // Fallback rate
  }
}