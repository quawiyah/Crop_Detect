const API_URL =
  "https://crop-disease-detector-8nqt.onrender.com";

// ============================================================
// LOGIN
// ============================================================

export async function login(phoneNumber, password) {
  const response = await fetch(
    `${API_URL}/user/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        phoneNumber,
        password,
      }),
    }
  );

  const contentType =
    response.headers.get("content-type");

  const data = contentType?.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new Error(
      typeof data === "object"
        ? data.message ||
            data.error ||
            "Login failed"
        : data || "Login failed"
    );
  }

  if (!data?.token) {
    throw new Error(
      "Login succeeded but no token was returned."
    );
  }

  localStorage.setItem(
    "token",
    data.token
  );

  // ----------------------------------------------------------
  // Get the phone number from the JWT.
  // ----------------------------------------------------------

  let loggedInPhoneNumber = phoneNumber;

  try {
    const tokenParts =
      data.token.split(".");

    if (tokenParts.length === 3) {
      const payload = JSON.parse(
        atob(
          tokenParts[1]
            .replace(/-/g, "+")
            .replace(/_/g, "/")
        )
      );

      if (payload.sub) {
        loggedInPhoneNumber =
          payload.sub;
      }
    }
  } catch (error) {
    console.warn(
      "Could not read phone number from JWT. Using login phone number.",
      error
    );
  }

  // ----------------------------------------------------------
  // Fetch the user's information directly from the backend.
  // ----------------------------------------------------------

  let user = null;

  try {
    user = await fetchUserByPhoneNumber(
      loggedInPhoneNumber,
      data.token
    );
  } catch (error) {
    console.error(
      "Could not retrieve user details:",
      error
    );
  }

  // Notify components that authentication changed.
  window.dispatchEvent(
    new Event("userUpdated")
  );

  return {
    ...data,
    user,
  };
}


// ============================================================
// GET USER BY PHONE NUMBER
// ============================================================

export async function fetchUserByPhoneNumber(
  phoneNumber,
  token = localStorage.getItem("token")
) {
  if (!phoneNumber) {
    throw new Error(
      "Phone number is required."
    );
  }

  if (!token) {
    throw new Error(
      "Authentication token is missing."
    );
  }

  const response = await fetch(
    `${API_URL}/user/${encodeURIComponent(
      phoneNumber
    )}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const contentType =
    response.headers.get("content-type");

  const data = contentType?.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new Error(
      typeof data === "object"
        ? data.message ||
            data.error ||
            "Could not retrieve user information."
        : data ||
            "Could not retrieve user information."
    );
  }

  return data;
}


// ============================================================
// GET CURRENT USER
// ============================================================

export async function getCurrentUser() {
  const token =
    localStorage.getItem("token");

  if (!token) {
    return null;
  }

  let phoneNumber = null;

  try {
    const tokenParts =
      token.split(".");

    if (tokenParts.length === 3) {
      const payload = JSON.parse(
        atob(
          tokenParts[1]
            .replace(/-/g, "+")
            .replace(/_/g, "/")
        )
      );

      phoneNumber = payload.sub;
    }
  } catch (error) {
    console.error(
      "Could not decode authentication token:",
      error
    );

    return null;
  }

  if (!phoneNumber) {
    return null;
  }

  try {
    const user =
      await fetchUserByPhoneNumber(
        phoneNumber,
        token
      );

    return user;
  } catch (error) {
    console.error(
      "Get current user failed:",
      error
    );

    return null;
  }
}


// ============================================================
// SIGNUP
// ============================================================

export async function signup(
  userData
) {
  const response = await fetch(
    `${API_URL}/user/CreateUser`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(userData),
    }
  );

  const responseBody =
    await response.text();

  let data = responseBody;

  try {
    data = JSON.parse(responseBody);
  } catch {
  }

  if (!response.ok) {
    throw new Error(
      typeof data === "object"
        ? data.message ||
            data.error ||
            `Signup failed with status ${response.status}`
        : data ||
            `Signup failed with status ${response.status}`
    );
  }

  return data;
}


// ============================================================
// LOGOUT
// ============================================================

export async function logout() {
  const token =
    localStorage.getItem("token");

  try {
    if (token) {
      await fetch(
        `${API_URL}/user/auth/logout`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    }
  } catch (error) {
    console.warn(
      "Logout request failed:",
      error
    );
  } finally {

    localStorage.removeItem("token");
    localStorage.removeItem(
      "cameraMacAddress"
    );

    window.dispatchEvent(
      new Event("userUpdated")
    );

    window.dispatchEvent(
      new Event("cameraChanged")
    );
  }

  return true;
}