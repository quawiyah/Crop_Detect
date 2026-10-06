import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaEnvelope } from "react-icons/fa";
import ApiConfig from "../config/ApiConfig";

const API_BASE = ApiConfig.getBaseUrl();

function ForgotPassword() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        const trimmed = email.trim();

        if (!trimmed) {
            setError("Please enter your email address.");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmed)) {
            setError("Please enter a valid email address.");
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(
                `${API_BASE}/user/forgotPassword/${encodeURIComponent(trimmed)}`,
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

            setSuccess(
                "A reset code has been sent to your email. Check your inbox."
            );

            // Give user a moment to read the message, then go to reset page
            setTimeout(() => {
                navigate("/reset-password", {
                    state: { email: trimmed },
                });
            }, 1500);
        } catch (err) {
            console.error("FORGOT PASSWORD ERROR", err);
            setError(
                err.message ||
                "Could not send reset link. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
                {/* BACK LINK */}
                <Link
                    to="/login"
                    className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-green-700"
                >
                    <FaArrowLeft /> Back to login
                </Link>

                {/* HEADER */}
                <div className="mb-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700">
                        <FaEnvelope />
                    </div>

                    <h1 className="text-3xl font-bold text-gray-800">
                        Forgot Password?
                    </h1>

                    <p className="mt-2 text-sm text-gray-500">
                        Enter the email address linked to your account and
                        we'll send you a code to reset your password.
                    </p>
                </div>

                {/* FORM */}
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
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (error) setError("");
                            }}
                            placeholder="aishalawal@gmail.com"
                            autoComplete="email"
                            disabled={loading}
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-xl bg-green-700 py-4 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? "Sending..." : "Send Reset Code"}
                    </button>
                </form>

                <p className="mt-8 text-center text-sm text-gray-600">
                    Remember your password?
                    <Link
                        to="/login"
                        className="ml-2 font-semibold text-green-700 hover:underline"
                    >
                        Login here
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default ForgotPassword;
