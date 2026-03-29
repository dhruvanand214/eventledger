import { useState } from "react";
import axios from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const login = async () => {
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    try {
      setLoading(true);
      setError("");

      const res = await axios.post("/auth/login", { email, password });
      const { token, user } = res.data;
      const isJwtLike = token && token.split(".").length === 3;

      if (!isJwtLike) {
        throw new Error("Login token is invalid. Please try again.");
      }

      localStorage.setItem("token", token);
      localStorage.setItem("role", user.role);
      localStorage.setItem("clubId", user.clubId || "");
      localStorage.setItem("clubName", user.clubName || "");
      localStorage.setItem("eventId", user.eventId || "");
      localStorage.setItem("eventName", user.eventName || "");
      localStorage.setItem("serviceType", user.serviceType || "full_time");
      localStorage.setItem("isEventActive", String(Boolean(user.isEventActive)));

      const role = user.role;
      if (role === "admin") navigate("/admin");
      if (role === "owner") navigate("/owner");
      if (role === "bartender") navigate("/bartender");
      if (role === "exit") navigate("/exit");
      if (role === "entry") navigate("/entry");
    } catch (err) {
      const serverMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Login failed. Please try again.";
      setError(serverMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") login();
  };

  return (
    <div className="page-bg min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #6366f1 0%, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #4cd7f6 0%, transparent 70%)" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] opacity-5"
          style={{ background: "radial-gradient(ellipse, #818cf8 0%, transparent 60%)" }}
        />
      </div>

      {/* Login card */}
      <div className="relative w-full max-w-md animate-slide-up">
        <div className="modal-panel">
          {/* Brand */}
          <div className="text-center mb-8">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl mb-4"
              style={{ background: "linear-gradient(135deg, #6366f1 0%, #4cd7f6 100%)", boxShadow: "0 8px 24px rgba(99,102,241,0.4)" }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 5h16v3H4V5zm0 5.5h16v3H4v-3zm0 5.5h10v3H4v-3z" fill="white" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold gradient-text tracking-tight">EventLedger</h1>
            <p className="mt-1 text-sm text-[#c7c4d7]">Venue & Event Management</p>
          </div>

          {/* Label */}
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-[#908fa0] mb-4 font-semibold">Secure Access</p>

          {/* Form */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-[#c7c4d7] mb-1.5 font-medium">Email address</label>
              <input
                id="login-email"
                className="input-nocturne"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-xs text-[#c7c4d7] mb-1.5 font-medium">Password</label>
              <input
                id="login-password"
                className="input-nocturne"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-sm text-rose-300">
                {error}
              </div>
            )}

            <button
              id="login-submit-btn"
              className="btn-primary w-full py-3 mt-2 text-sm"
              onClick={login}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-[0.7rem] text-[#464554]">
            Secure access · Role-based platform
          </p>
        </div>
      </div>
    </div>
  );
}
