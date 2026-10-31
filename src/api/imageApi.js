const API_URL = `${import.meta.env.VITE_API_URL.replace(/\/+$/, "")}/api/images`;

// Fetch all public gallery images
export const getImages = async () => {
  const response = await fetch(API_URL);

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Failed to fetch images.");
  }

  return data.images;
};

// Upload an image
export const uploadImage = async (title, file) => {
  const formData = new FormData();

  formData.append("title", title);
  formData.append("image", file);

  const response = await fetch(`${API_URL}/upload`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Failed to upload image.");
  }

  return data.image;
};

// Delete an image
export const deleteImage = async (id) => {
  const response = await fetch(`${API_URL}/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Failed to delete image.");
  }

  return data;
};

// Update image
export const updateImage = async (id, title) => {
  const response = await fetch(
    `${API_URL}/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title }),
    }
  );

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Failed to update image.");
  }

  return data.image;
};