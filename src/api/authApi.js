
const API_URL = "http://localhost:5000/api/auth";

// Log in as admin
export const loginAdmin = async (email, password) => {
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Admin login failed.");
  }

  return data.admin;
};

// Check whether the admin session is valid
export const getAdminSession = async () => {
  const response = await fetch(`${API_URL}/me`, {
    method: "GET",
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Please log in as an admin.");
  }

  return data.admin;
};

// Log out the current admin
export const logoutAdmin = async () => {
  const response = await fetch(`${API_URL}/logout`, {
    method: "POST",
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Admin logout failed.");
  }

  return data;
};
