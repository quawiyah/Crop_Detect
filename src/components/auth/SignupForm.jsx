import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaEye,
  FaEyeSlash,
  FaArrowRight,
} from "react-icons/fa";
import ApiConfig from "../../config/ApiConfig";
import { signup } from "../../services/auth";

function SignupForm() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    farmName: "",
    farmLocation: "",
    farmSize: "",
    crop: "",
    password: "",
    otp: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Email verification states
  const [verifying, setVerifying] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Reset verification state if email is changed after an OTP was sent
    if (name === "email") {
      setVerificationSent(false);
      setVerificationMessage("");
    }

    // Remove error when user starts correcting the form
    if (error) {
      setError("");
    }
  };

  const validateForm = () => {
    const {
      fullName,
      email,
      phoneNumber,
      farmName,
      farmLocation,
      farmSize,
      crop,
      password,
      otp,
    } = formData;

    if (!fullName.trim()) {
      return "Please enter your full name.";
    }

    if (!email.trim()) {
      return "Please enter your email address.";
    }

    if (!phoneNumber.trim()) {
      return "Please enter your phone number.";
    }

    if (!farmName.trim()) {
      return "Please enter your farm name.";
    }

    if (!farmLocation.trim()) {
      return "Please enter your farm location.";
    }

    if (!farmSize) {
      return "Please enter your farm size.";
    }

    if (Number(farmSize) <= 0) {
      return "Farm size must be greater than 0.";
    }

    if (!crop) {
      return "Please select your primary crop.";
    }

    if (!password) {
      return "Please enter a password.";
    }

    if (password.length < 6) {
      return "Password must be at least 6 characters.";
    }

    // Require otp if a verification code (OTP) was sent
    if (verificationSent && !otp.trim()) {
      return "Please enter the OTP sent to your email.";
    }

    return null;
  };

  // HANDLE SEND VERIFICATION OTP
  const handleSendOtp = async () => {
    const email = formData.email.trim();

    if (!email) {
      setError("Please enter your email address first.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setError("");
      setVerificationMessage("");
      setVerifying(true);

      const response = await fetch(
          ApiConfig.buildUrl(`/user/sendOtpToEmail/${encodeURIComponent(email)}`),
          {
            method: "POST",
            headers: { accept: "*/*" },
          }
      );

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        console.error("Send OTP failed:", response.status, text);
        throw new Error(
            text || `Failed to send OTP (${response.status})`
        );
      }

      setVerificationSent(true);
      setVerificationMessage(
          "An OTP has been sent to your email."
      );
    } catch (err) {
      console.error("SEND OTP ERROR", err);
      setError(err.message || "Could not send OTP.");
    } finally {
      setVerifying(false);
    }
  };

  // HANDLE SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);

      const signupData = {
        phoneNumber: formData.phoneNumber.trim(),
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        crop: formData.crop,
        farmName: formData.farmName.trim(),
        farmLocation: formData.farmLocation.trim(),
        farmSize: String(formData.farmSize),
        otp: formData.otp.trim(),
      };

      console.log("SIGNUP REQUEST");
      console.log(
          "URL:",
          ApiConfig.buildUrl("/user/CreateUser")
      );
      console.log("Payload:", signupData);

      const response = await signup(signupData);

      console.log("SIGNUP SUCCESS");
      console.log("Response:", response);

      // REDIRECT TO LOGIN
      navigate("/login", {
        state: {
          message: "Account created successfully. Please login.",
        },
      });
    } catch (err) {
      console.error("SIGNUP ERROR");
      console.error(err);

      setError(
          err.message || "Unable to create account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="w-full max-w-xl rounded-3xl bg-white p-8 shadow-xl">
        {/* HEADER */}
        <div>
          <h1 className="text-4xl font-bold text-gray-800">
            Create Account
          </h1>

          <p className="mt-2 text-gray-500">
            Set up your AgriAI account and farm profile.
          </p>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {/* ERROR MESSAGE */}
          {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
          )}

          {/* FULL NAME */}
          <div>
            <label
                htmlFor="fullName"
                className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Full Name
            </label>

            <input
                id="fullName"
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Aisha Lawal"
                autoComplete="name"
                disabled={loading}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
            />
          </div>

          {/* EMAIL + VERIFY BUTTON */}
          <div>
            <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Email Address
            </label>

            <div className="flex gap-2">
              <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="aishalawal@gmail.com"
                  autoComplete="email"
                  disabled={loading || verifying}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
              />

              <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={
                      loading ||
                      verifying ||
                      !formData.email.trim() ||
                      verificationSent
                  }
                  className="shrink-0 rounded-xl bg-green-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {verifying
                    ? "Sending..."
                    : verificationSent
                        ? "Sent ✓"
                        : "Verify"}
              </button>
            </div>

            {verificationMessage && (
                <p className="mt-1 text-xs text-green-600">
                  {verificationMessage}
                </p>
            )}
          </div>

          {/* VERIFICATION OTP (only shows after an OTP is sent) */}
          {verificationSent && (
              <div>
                <label
                    htmlFor="otp"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  OTP Code
                </label>

                <input
                    id="otp"
                    type="text"
                    name="otp"
                    value={formData.otp}
                    onChange={handleChange}
                    placeholder="Enter the OTP sent to your email"
                    inputMode="numeric"
                    disabled={loading}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
                />
              </div>
          )}

          {/* PHONE NUMBER */}
          <div>
            <label
                htmlFor="phoneNumber"
                className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Phone Number
            </label>

            <input
                id="phoneNumber"
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="09018272221"
                autoComplete="tel"
                disabled={loading}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
            />

            <p className="mt-1 text-xs text-gray-400">
              Example: 09018272221 or 2349018272221
            </p>
          </div>

          {/* FARM DETAILS */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* FARM NAME */}
            <div>
              <label
                  htmlFor="farmName"
                  className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Farm Name
              </label>

              <input
                  id="farmName"
                  type="text"
                  name="farmName"
                  value={formData.farmName}
                  onChange={handleChange}
                  placeholder="Lawal Farm"
                  disabled={loading}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
              />
            </div>

            {/* FARM LOCATION */}
            <div>
              <label
                  htmlFor="farmLocation"
                  className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Farm Location
              </label>

              <input
                  id="farmLocation"
                  type="text"
                  name="farmLocation"
                  value={formData.farmLocation}
                  onChange={handleChange}
                  placeholder="Lagos"
                  disabled={loading}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
              />
            </div>
          </div>

          {/* FARM SIZE */}
          <div>
            <label
                htmlFor="farmSize"
                className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Farm Size (Acres)
            </label>

            <input
                id="farmSize"
                type="number"
                name="farmSize"
                value={formData.farmSize}
                onChange={handleChange}
                placeholder="300"
                min="0"
                step="0.01"
                disabled={loading}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
            />
          </div>

          {/* PRIMARY CROP */}
          <div>
            <label
                htmlFor="crop"
                className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Primary Crop
            </label>

            <select
                id="crop"
                name="crop"
                value={formData.crop}
                onChange={handleChange}
                disabled={loading}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
            >
              <option value="">Select Primary Crop</option>

              <option value="Maize">Maize</option>
              <option value="Rice">Rice</option>
              <option value="Cassava">Cassava</option>
              <option value="Tomato">Tomato</option>
              <option value="Pepper">Pepper</option>
              <option value="Yam">Yam</option>
              <option value="Potato">Potato</option>
              <option value="Wheat">Wheat</option>
            </select>
          </div>

          {/* PASSWORD */}
          <div>
            <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Password
            </label>

            <div className="relative">
              <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="new-password"
                  disabled={loading}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-12 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
              />

              <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  disabled={loading}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 transition hover:text-green-700 disabled:cursor-not-allowed"
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            <p className="mt-1 text-xs text-gray-400">
              Password must be at least 6 characters.
            </p>
          </div>

          {/* SUBMIT BUTTON */}
          <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-700 py-4 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
                "Creating Account..."
            ) : (
                <>
                  Create Account
                  <FaArrowRight />
                </>
            )}
          </button>
        </form>

        {/* LOGIN LINK */}
        <p className="mt-8 text-center text-gray-600">
          Already have an account?
          <Link
              to="/login"
              className="ml-2 font-semibold text-green-700 hover:underline"
          >
            Login here
          </Link>
        </p>

        {/* FOOTER */}
        <div className="mt-8 flex justify-center gap-8 text-sm text-gray-500">
          <button
              type="button"
              className="hover:text-green-700"
          >
            Privacy Policy
          </button>

          <button
              type="button"
              className="hover:text-green-700"
          >
            Security Standards
          </button>
        </div>
      </div>
  );
}

export default SignupForm;