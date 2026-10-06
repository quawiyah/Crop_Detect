import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaEye, FaEyeSlash, FaArrowLeft, FaLock } from "react-icons/fa";
import ApiConfig from "../config/ApiConfig";

const API_BASE = ApiConfig.getBaseUrl();

function ResetPassword() {
    const navigate = useNavigate();
    const location = useLocation();

    // Email may be passed from ForgotPassword page
    const prefilledEmail = location.state?.email || "";

    const [formData, setFormData] = useState({
        email: prefilledEmail,
        token: "",
        newPassword: "",
        confirmPassword: "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (error) setError("");
    };

    const validateForm = () => {
        const { email, token, newPassword, confirmPassword } = formData;

        if (!email.trim()) return "Please enter your email address.";
        if (!token.trim()) return "Please enter the reset token.";
        if (!newPassword) return "Please enter a new password.";
        if (newPassword.length < 6)
            return "Password must be at least 6 characters.";
        if (newPassword !== confirmPassword)
            return "Passwords do not match.";

        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            setLoading(true);

            const token = encodeURIComponent(formData.token.trim());
            const newPassword = encodeURIComponent(formData.newPassword);

            const response = await fetch(
                `${API_BASE}/user/reset-password?token=${token}&newPassword=${newPassword}`,
                {
                    method: "POST",
                    headers: { accept: "*/*" },
                }
            );

            if (!response.ok) {
                const text = await response.text().catch(() => "");
                throw new Error(
                    text || `Request failed (${response.status})`
                );
            }

            setSuccess("Password reset successfully! Redirecting...");

            setTimeout(() => {
                navigate("/login", {
                    state: {
                        message:
                            "Password reset successful. Please login with your new password.",
                    },
                });
            }, 1500);
        } catch (err) {
            console.error("RESET PASSWORD ERROR", err);
            setError(
                err.message ||
                "Could not reset password. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
                <Link
                    to="/forgot-password"
                    className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-green-700"
                >
                    <FaArrowLeft /> Back
                </Link>

                <div className="mb-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700">
                        <FaLock />
                    </div>

                    <h1 className="text-3xl font-bold text-gray-800">
                        Reset Password
                    </h1>

                    <p className="mt-2 text-sm text-gray-500">
                        Enter the code you received by email and choose a new
                        password.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                            {success}
                        </div>
                    )}

                    {/* EMAIL */}
                    <div>
                        <label
                            htmlFor="email"
                            className="mb-2 block text-sm font-semibold text-gray-700"
                        >
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="aishalawal@gmail.com"
                            autoComplete="email"
                            disabled={loading}
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
                        />
                    </div>

                    {/* TOKEN */}
                    <div>
                        <label
                            htmlFor="token"
                            className="mb-2 block text-sm font-semibold text-gray-700"
                        >
                            Reset Code
                        </label>
                        <input
                            id="token"
                            type="text"
                            name="token"
                            value={formData.token}
                            onChange={handleChange}
                            placeholder="Enter the code from your email"
                            inputMode="numeric"
                            disabled={loading}
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
                        />
                    </div>

                    {/* NEW PASSWORD */}
                    <div>
                        <label
                            htmlFor="newPassword"
                            className="mb-2 block text-sm font-semibold text-gray-700"
                        >
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                id="newPassword"
                                type={showPassword ? "text" : "password"}
                                name="newPassword"
                                value={formData.newPassword}
                                onChange={handleChange}
                                placeholder="Enter new password"
                                autoComplete="new-password"
                                disabled={loading}
                                className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-12 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((p) => !p)}
                                disabled={loading}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-green-700"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                    </div>

                    {/* CONFIRM PASSWORD */}
                    <div>
                        <label
                            htmlFor="confirmPassword"
                            className="mb-2 block text-sm font-semibold text-gray-700"
                        >
                            Confirm Password
                        </label>
                        <div className="relative">
                            <input
                                id="confirmPassword"
                                type={showConfirm ? "text" : "password"}
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Re-enter new password"
                                autoComplete="new-password"
                                disabled={loading}
                                className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-12 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm((p) => !p)}
                                disabled={loading}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-green-700"
                                aria-label={showConfirm ? "Hide password" : "Show password"}
                            >
                                {showConfirm ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-xl bg-green-700 py-4 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? "Resetting..." : "Reset Password"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ResetPassword;