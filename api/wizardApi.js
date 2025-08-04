import axios from "axios";

// * Base URL for the Wizard API, loaded from environment variables
const BASE_URL = process.env.WIZARD_API_URL;

/**
 * * Create a new VPN service.
 * @param {number} gig - Amount of data in gigabytes.
 * @param {number} day - Number of days for the service.
 * @param {number} [test=0] - Set to 1 for test service, 0 for normal.
 * @returns {Promise<Object>} - API response data.
 */
export async function createVpnService(gig, day, test = 0) {
  try {
    // * Prepare form data
    const params = new URLSearchParams();
    params.append("gig", gig);
    params.append("day", day);
    params.append("test", test);

    // * Send POST request to create service
    const response = await axios.post(`${BASE_URL}/create`, params.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${process.env.VPN_API_KEY}`,
      },
    });

    return response.data;
  } catch (error) {
    // * If API returns an error response, return its data
    if (error.response) {
      return error.response.data;
    }
    // * Otherwise, throw the error
    throw error;
  }
}

/**
 * * Find a VPN service by username.
 * @param {string} username - The username of the service.
 * @returns {Promise<Object>} - API response data.
 */
export async function findService(username) {
  try {
    // * Prepare form data
    const params = new URLSearchParams();
    params.append("username", username);

    // * Send POST request to find service
    const response = await axios.post(`${BASE_URL}/find`, params.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${process.env.VPN_API_KEY}`,
      },
    });

    return response.data;
  } catch (error) {
    // * Log error details for debugging
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

/**
 * * Create a test VPN service.
 * @returns {Promise<Object>} - API response data.
 */
export async function createTestService() {
  try {
    // * Prepare form data for test service
    const params = new URLSearchParams();
    params.append("test", "1");

    // * Send POST request to create test service
    const response = await axios.post(`${BASE_URL}/create`, params.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${process.env.VPN_API_KEY}`,
      },
    });

    return response.data;
  } catch (error) {
    // * If API returns an error response, return its data
    if (error.response) {
      return error.response.data;
    }
    throw error;
  }
}

/**
 * * Change the link for a VPN service.
 * @param {string} username - The username of the service.
 * @returns {Promise<Object>} - API response data.
 */
export async function changeLinkService(username) {
  try {
    // * Prepare form data
    const params = new URLSearchParams();
    params.append("username", username);

    // * Send POST request to change the service link
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
    // * Log error details for debugging
    console.error("Error in changeLinkService:", error.message);
    if (error.response) {
      console.error("API Error response:", error.response.data);
      return error.response.data;
    }
    throw error;
  }
}

// * Delete Service

/**
 * * Delete a VPN service.
 * @param {string} username - The username of the service to delete.
 * @returns {Promise<Object>} - API response data.
 */
export async function deleteService(username) {
  try {
    // * Prepare form data
    const params = new URLSearchParams();
    params.append("username", username);

    // * Send POST request to delete the service
    const response = await axios.post(`${BASE_URL}/delsvc`, params.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${process.env.VPN_API_KEY}`,
      },
    });
    return response.data;
  } catch (error) {
    // * If API returns an error response, return its data
    if (error.response) {
      return error.response.data;
    }
    throw error;
  }
}

// * Deactivate Service

/**
 * * Deactivate (reverse mode) a VPN service.
 * @param {string} username - The username of the service to deactivate.
 * @returns {Promise<Object>} - API response data.
 */
export async function deactiveService(username) {
  try {
    // * Prepare form data
    const params = new URLSearchParams();
    params.append("username", username);

    // * Send POST request to deactivate the service
    const response = await axios.post(
      `${BASE_URL}/reverse_mode`,
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
    // * If API returns an error response, return its data
    if (error.response) {
      return error.response.data;
    }
  }
}

// * Upgrade Time

/**
 * * Upgrade the time for a VPN service.
 * @param {string} username - The username of the service.
 * @returns {Promise<Object>} - API response data.
 */
export async function upgradeServiceTime(username, day) {
  const params = new URLSearchParams();
  params.append("username", username);
  params.append("day", day);
  try {
    const response = await axios.post(
      `${BASE_URL}/upg_time`,
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
    if (error.response) {
      return error.response;
    }
  }
}
// * Upgrade Data

/**
 * * Upgrade the data for a VPN service.
 * @param {string} username - The username of the service.
 * @returns {Promise<Object>} - API response data.
 */
export async function upgradeServiceData(username, gig) {
  const params = new URLSearchParams();
  params.append("username", username);
  params.append("gig", gig);
  try {
    const response = await axios.post(
      `${BASE_URL}/upg_size`,
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
    if (error.response) {
      return error.response;
    }
  }
}

// * Status
export async function StatusApi() {
  try {
    const response = await axios.get(`${BASE_URL}/status`, {
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
