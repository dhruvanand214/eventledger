import { useState } from "react";
import axios from "../api/axios";
import GlassCard from "./GlassCard";

export default function CreateUser() {
  const [selectedMode, setSelectedMode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [clubName, setClubName] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });

  const createOwner = async (e) => {
    e.preventDefault();

    try {
      await axios.post("/auth/register", {
        name,
        email,
        password,
        role: "owner",
        clubName,
        serviceType: selectedMode
      });

      setStatus({ type: "success", message: "Owner created. Club ID was auto-generated." });
      setName("");
      setEmail("");
      setPassword("");
      setClubName("");
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "Failed to create owner";
      setStatus({ type: "error", message });
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <GlassCard>
        {!selectedMode && (
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.2em] text-[#908fa0] font-semibold">Setup</p>
            <h2 className="mt-2 text-2xl font-bold text-[#e4dfff] mb-1">Create Club Owner</h2>
            <p className="text-sm text-[#c7c4d7] mb-6">Choose the owner mode to get started.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                id="admin-select-onetime-btn"
                className="rounded-2xl border border-[rgba(70,69,84,0.3)] bg-[rgba(52,49,80,0.5)] p-5 text-left hover:bg-[rgba(52,49,80,0.8)] hover:border-indigo-500/30 transition-all"
                onClick={() => setSelectedMode("one_time")}
              >
                <div className="h-10 w-10 rounded-xl bg-cyan-500/20 flex items-center justify-center mb-3">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="#4cd7f6" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <p className="font-semibold text-[#e4dfff]">One-time Event</p>
                <p className="mt-1 text-xs text-[#908fa0]">For private events, weddings, and pop-ups.</p>
              </button>
              <button
                id="admin-select-fulltime-btn"
                className="rounded-2xl border border-[rgba(70,69,84,0.3)] bg-[rgba(52,49,80,0.5)] p-5 text-left hover:bg-[rgba(52,49,80,0.8)] hover:border-indigo-500/30 transition-all"
                onClick={() => setSelectedMode("full_time")}
              >
                <div className="h-10 w-10 rounded-xl bg-indigo-500/20 flex items-center justify-center mb-3">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="#c0c1ff" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M9 22V12h6v10" stroke="#c0c1ff" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <p className="font-semibold text-[#e4dfff]">Full-time Club</p>
                <p className="mt-1 text-xs text-[#908fa0]">For permanent clubs, bars, and venues.</p>
              </button>
            </div>
          </div>
        )}

        {selectedMode && (
          <form onSubmit={createOwner} className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.2em] text-[#908fa0] font-semibold">New Owner</p>
                <h2 className="mt-1 text-xl font-bold text-[#e4dfff]">
                  {selectedMode === "one_time" ? "One-time Event Owner" : "Full-time Club Owner"}
                </h2>
              </div>
              <button
                type="button"
                id="admin-change-mode-btn"
                className="btn-ghost text-xs px-3 py-1.5"
                onClick={() => { setSelectedMode(""); setStatus({ type: "", message: "" }); }}
              >
                Change Mode
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#c7c4d7] mb-1.5 font-medium">Owner Name</label>
                <input
                  id="admin-owner-name-input"
                  className="input-nocturne"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-[#c7c4d7] mb-1.5 font-medium">Email</label>
                <input
                  id="admin-owner-email-input"
                  className="input-nocturne"
                  type="email"
                  placeholder="owner@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#c7c4d7] mb-1.5 font-medium">Password</label>
                <input
                  id="admin-owner-password-input"
                  className="input-nocturne"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-[#c7c4d7] mb-1.5 font-medium">Club / Venue Name</label>
                <input
                  id="admin-club-name-input"
                  className="input-nocturne"
                  placeholder="e.g. The Velvet Lounge"
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-4">
              {status.message ? (
                <p className={`text-sm ${status.type === "error" ? "text-rose-400" : "text-emerald-400"}`}>
                  {status.message}
                </p>
              ) : <span />}
              <button
                id="admin-create-owner-btn"
                type="submit"
                className="btn-primary"
              >
                Create Owner
              </button>
            </div>
          </form>
        )}
      </GlassCard>
    </div>
  );
}
