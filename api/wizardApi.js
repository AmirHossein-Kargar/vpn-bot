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
    const params = new URLSearchParams();
    params.append("username", username);

    const response = await axios.post(`${BASE_URL}/find`, params.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${process.env.VPN_API_KEY}`,
      },
    });

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

export async function changeLinkService(username) {
  try {
    const params = new URLSearchParams();
    params.append("username", username);
    const response = await axios.post(
      `${BASE_URL}/change_link`,
      params.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${process.env.VPN_API_KEY}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error in changeLinkService:", error.message);
    if (error.response) {
      console.error("API Error response:", error.response.data);
      return error.response.data;
    }
    throw error;
  }
}

// * Delete Service
export async function deleteService(username) {
  try {
    const params = new URLSearchParams();
    params.append("username", username);
    const response = await axios.post(`${BASE_URL}/delsvc`, params.toString(), {
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

// * Deactivate Service
export async function deactiveService(username) {
  try {
    const params = new URLSearchParams();
    params.append("username", username);
    const response = await axios.post(`${BASE_URL}/reverse_mode`, params.toString(), {
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
  }
}