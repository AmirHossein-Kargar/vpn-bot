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
