import { useEffect, useState } from "react";

import ProfileCard from "./ProfileCard";
import FarmDetails from "./FarmDetails";

const API_URL = "https://crop-disease-detector-8nqt.onrender.com";

function FarmerProfile() {
  const [editOpen, setEditOpen] = useState(false);

  const [user, setUser] = useState({
    phoneNumbers: "",
    name: "",
    email: "",
    notificationPreference: "SMS",
    crop: "",
    farmName: "",
    farmLocation: "",
    farmSize: "",
  });

  const [formData, setFormData] = useState(user);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadUser = () => {
      const storedUser = localStorage.getItem("user");

      if (!storedUser) {
        return;
      }

      try {
        const parsedUser = JSON.parse(storedUser);

        const details = {
          phoneNumbers: parsedUser.phoneNumbers || "",
          name: parsedUser.name || parsedUser.fullName || "",
          email: parsedUser.email || "",
          notificationPreference:
            parsedUser.notificationPreference || "SMS",
          crop: parsedUser.crop || "",
          farmName: parsedUser.farmName || "",
          farmLocation:
            parsedUser.farmLocation || parsedUser.location || "",
          farmSize: parsedUser.farmSize || "",
        };

        setUser(details);
        setFormData(details);
      } catch (error) {
        console.error("Failed to parse stored user:", error);
      }
    };

    loadUser();

    window.addEventListener("userUpdated", loadUser);

    return () => {
      window.removeEventListener("userUpdated", loadUser);
    };
  }, []);

  const handleEdit = () => {
    setFormData(user);
    setEditOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCancel = () => {
    setFormData(user);
    setEditOpen(false);
  };

  const handleSave = async (e) => {
  e.preventDefault();

  try {
    setSaving(true);

    const token = localStorage.getItem("token");

    console.log("Token exists:", !!token);
    console.log("Current user:", user);
    console.log("Updating phone:", user.phoneNumbers);
    console.log("Form data:", formData);

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(
      `${API_URL}/user/user/${encodeURIComponent(user.phoneNumbers)}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      }
    );

    const responseText = await response.text();

    console.log("Update status:", response.status);
    console.log("Update response:", responseText);

    if (!response.ok) {
      throw new Error(
        `Failed to update profile (${response.status}): ${responseText}`
      );
    }

    let updatedUser = formData;

    if (responseText) {
      try {
        updatedUser = JSON.parse(responseText);
      } catch {
        console.log("Backend did not return JSON. Using submitted data.");
      }
    }

    localStorage.setItem("user", JSON.stringify(updatedUser));

    setUser(updatedUser);
    setFormData(updatedUser);
    setEditOpen(false);

    window.dispatchEvent(new Event("userUpdated"));
  } catch (error) {
    console.error("Profile update error:", error);
  } finally {
    setSaving(false);
  }
};

  return (
    <>
      <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-800">
            Farmer Profile
          </h1>

          <p className="mt-3 text-gray-500">
            Account and farm information used to personalise predictions.
          </p>
        </div>

        <button
          onClick={handleEdit}
          className="rounded-xl border border-gray-200 bg-white px-6 py-3 shadow-sm transition hover:bg-gray-50"
        >
          Edit Profile
        </button>
      </div>

      <div className="grid gap-8 xl:grid-cols-2">
        <ProfileCard user={user} />

        <FarmDetails user={user} />
      </div>

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl md:p-8">

            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Edit Profile
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Update your account and farm information.
                </p>
              </div>

              <button
                onClick={handleCancel}
                className="text-2xl text-gray-400 transition hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="grid gap-5 md:grid-cols-2">

              <FormField
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />

              <FormField
                label="Phone Number"
                name="phoneNumbers"
                value={formData.phoneNumbers}
                onChange={handleChange}
              />

              <FormField
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
              />

              <FormField
                label="Farm Name"
                name="farmName"
                value={formData.farmName}
                onChange={handleChange}
              />

              <FormField
                label="Farm Size"
                name="farmSize"
                value={formData.farmSize}
                onChange={handleChange}
              />

              <FormField
                label="Farm Location"
                name="farmLocation"
                value={formData.farmLocation}
                onChange={handleChange}
              />

              <FormField
                label="Crop"
                name="crop"
                value={formData.crop}
                onChange={handleChange}
              />

            </div>

            <div className="mt-8 flex justify-end gap-3 border-t border-gray-100 pt-6">

              <button
                onClick={handleCancel}
                disabled={saving}
                className="rounded-xl border border-gray-200 bg-white px-6 py-3 text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-xl bg-green-600 px-6 py-3 font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>

            </div>

          </div>
        </div>
      )}
    </>
  );
}

function FormField({
  label,
  name,
  value,
  onChange,
  type = "text",
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </label>

      <input
        type={type}
        name={name}
        value={value || ""}
        onChange={onChange}
        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-800 outline-none transition focus:border-green-600 focus:ring-1 focus:ring-green-100"
      />
    </div>
  );
}

export default FarmerProfile;