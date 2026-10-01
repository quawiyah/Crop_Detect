import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaCamera,
  FaArrowRight,
  FaCheckCircle,
} from "react-icons/fa";

const API_URL =
  "https://crop-disease-detector-8nqt.onrender.com";

// ============================================================
// MAC ADDRESS HELPERS
// ============================================================

function normalizeMacAddress(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-F0-9]/g, "");
}

function formatMacAddress(value) {
  const normalized =
    normalizeMacAddress(value);

  if (normalized.length !== 12) {
    return value || "";
  }

  return normalized
    .match(/.{1,2}/g)
    .join(":");
}

function isValidMacAddress(value) {
  return (
    normalizeMacAddress(value).length === 12
  );
}


// ============================================================
// CAMERA SETUP
// ============================================================

function CameraSetup() {
  const navigate = useNavigate();

  const [macAddress, setMacAddress] =
    useState(
      localStorage.getItem(
        "cameraMacAddress"
      ) || ""
    );

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [linking, setLinking] =
    useState(false);


  // ==========================================================
  // LINK DETECTOR TO AUTHENTICATED USER
  // ==========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    // --------------------------------------------------------
    // Validate MAC address
    // --------------------------------------------------------

    if (!macAddress.trim()) {
      setError(
        "Please enter your camera MAC address."
      );

      return;
    }

    if (!isValidMacAddress(macAddress)) {
      setError(
        "Please enter a valid MAC address, for example AA:BB:CC:DD:EE:FF."
      );

      return;
    }

    const formattedMac =
      formatMacAddress(macAddress);


    // --------------------------------------------------------
    // Get logged-in user's authentication token
    // --------------------------------------------------------

    const token =
      localStorage.getItem("token");

    if (!token) {
      setError(
        "Your session has expired. Please log in again."
      );

      return;
    }


    // --------------------------------------------------------
    // Start linking
    // --------------------------------------------------------

    setLinking(true);

    try {

      const url =
        `${API_URL}/gas-detectors/user/link` +
        `?macAddress=${encodeURIComponent(
          formattedMac
        )}`;

      const response =
        await fetch(url, {
          method: "POST",

          headers: {
            Accept: "*/*",

            Authorization:
              `Bearer ${token}`,
          },
        });


      // ------------------------------------------------------
      // Read backend response
      // ------------------------------------------------------

      const contentType =
        response.headers.get(
          "content-type"
        );

      const data =
        contentType?.includes(
          "application/json"
        )
          ? await response.json()
          : await response.text();


      // ------------------------------------------------------
      // Handle HTTP errors
      // ------------------------------------------------------

      if (!response.ok) {
        throw new Error(
          typeof data === "object"
            ? data?.message ||
                data?.error ||
                `Could not link camera (${response.status})`
            : data ||
                `Could not link camera (${response.status})`
        );
      }


      // ------------------------------------------------------
      // Handle successful backend response
      // ------------------------------------------------------

      if (
        typeof data === "object" &&
        data?.success === true
      ) {

        localStorage.setItem(
          "cameraMacAddress",
          formattedMac
        );

        localStorage.setItem(
          "cameraConfigured",
          "true"
        );


        setSuccess(
          data?.message ||
            "Camera linked successfully."
        );


        // ----------------------------------------------------
        // Move to dashboard
        // ----------------------------------------------------

        setTimeout(() => {
          navigate("/dashboard", {
            replace: true,
          });
        }, 700);

        return;
      }


      // ------------------------------------------------------
      // Unexpected response
      // ------------------------------------------------------

      throw new Error(
        typeof data === "object"
          ? data?.message ||
              "The camera could not be linked."
          : "The camera could not be linked."
      );

    } catch (error) {
      console.error(
        "Camera linking error:",
        error
      );

      setError(
        error?.message ||
          "Unable to link the camera. Please try again."
      );
    } finally {
      setLinking(false);
    }
  };


  // ==========================================================
  // CLEAR SAVED CAMERA
  // ==========================================================

  const handleClear = () => {
    localStorage.removeItem(
      "cameraMacAddress"
    );

    localStorage.removeItem(
      "cameraConfigured"
    );

    setMacAddress("");
    setError("");
    setSuccess("");
  };


  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5FAF5] px-4 py-8">

      <div className="w-full max-w-xl rounded-3xl bg-white p-8 shadow-xl md:p-10">

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 text-2xl text-green-600">
          <FaCamera />
        </div>

        <div className="mt-6 text-center">

          <p className="text-sm font-semibold uppercase tracking-wider text-green-600">
            Camera Setup
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            Connect Your Smart Camera
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-500">
            Enter the MAC address of your
            smartEyes camera to link it to
            your account and connect it to
            your farm monitoring dashboard.
          </p>

        </div>


        {/* ==================================================
            FORM
        ================================================== */}

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-5"
        >

          {/* MAC ADDRESS */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Camera MAC Address
            </label>

            <input
              type="text"
              value={macAddress}
              onChange={(event) =>
                setMacAddress(
                  event.target.value
                )
              }
              placeholder="AA:BB:CC:DD:EE:FF"
              maxLength={17}
              disabled={linking}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 font-mono text-sm uppercase outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:cursor-not-allowed disabled:bg-gray-100"
            />

            <p className="mt-2 text-xs text-gray-400">
              Example: AA:BB:CC:DD:EE:FF
            </p>

          </div>


          {/* ==================================================
              ERROR
          ================================================== */}

          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}


          {/* ==================================================
              SUCCESS
          ================================================== */}

          {success && (
            <div className="flex items-start gap-3 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">

              <FaCheckCircle className="mt-0.5 shrink-0" />

              <span>
                {success}
              </span>

            </div>
          )}


          {/* ==================================================
              CONNECT BUTTON
          ================================================== */}

          <button
            type="submit"
            disabled={linking}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-700 py-4 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
          >

            {linking
              ? "Linking Camera..."
              : "Connect Camera"}

            {!linking && (
              <FaArrowRight />
            )}

          </button>


          {/* ==================================================
              CLEAR CAMERA
          ================================================== */}

          {/* {macAddress && !linking && (
            <button
              type="button"
              onClick={handleClear}
              className="w-full rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-500 transition hover:bg-gray-50 hover:text-gray-700"
            >
              Clear Saved Camera
            </button>
          )} */}

        </form>

      </div>

    </div>
  );
}

export default CameraSetup;
