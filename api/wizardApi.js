import axios from "axios";

const BASE_URL = process.env.WIZARD_API_URL;

export async function createVpnService(gig, day, test = 0) {
  try {
    const params = new URLSearchParams();
    params.append("gig", gig);
    params.append("day", day);
    params.append("test", test);

    const response = await axios.post(`${BASE_URL}/create`, params.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${process.env.VPN_API_KEY}`,
      },
    });

    return response.data;
  } catch (error) {
    if (error.response) {
      return error.response.data;
    }
    throw error;
  }
}

export async function findService(username) {
  try {
    console.log("findService called with username:", username);
    console.log("BASE_URL:", BASE_URL);

    const params = new URLSearchParams();
    params.append("username", username);

    console.log("Request params:", params.toString());

    const response = await axios.post(`${BASE_URL}/find`, params.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${process.env.VPN_API_KEY}`,
      },
    });

    console.log("API Response status:", response.status);
    console.log("API Response data:", JSON.stringify(response.data, null, 2));

    return response.data;
  } catch (error) {
    console.log("API Error:", error.message);
    if (error.response) {
      console.log("Error response status:", error.response.status);
      console.log(
        "Error response data:",
        JSON.stringify(error.response.data, null, 2)
      );
      return error.response.data;
    }
    throw error;
  }
}

export async function createTestService() {
  try {
    const params = new URLSearchParams();
    params.append("test", "1");

    const response = await axios.post(`${BASE_URL}/create`, params.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${process.env.VPN_API_KEY}`,
      },
    });

    return response.data;
  } catch (error) {
    if (error.response) {
      return error.response.data;
    }
    throw error;
  }
}
