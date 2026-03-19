import { useState } from "react";
import axios from "../api/axios";
import GlassCard from "./GlassCard";

export default function CreateUser() {
  const [selectedMode, setSelectedMode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [clubName, setClubName] = useState("");
  const [status, setStatus] = useState("");

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

      setStatus("Owner created. Club ID was auto-generated.");
      setName("");
      setEmail("");
      setPassword("");
      setClubName("");
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "Failed to create owner";
      setStatus(message);
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <GlassCard>
        {!selectedMode && (
          <div>
            <h2 className="text-white text-2xl font-semibold mb-2">Create Club Owner</h2>
            <p className="text-white/70 text-sm mb-5">Choose owner mode first.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                className="rounded-xl border border-white/30 bg-white/10 px-5 py-4 text-white hover:bg-white/20"
                onClick={() => setSelectedMode("one_time")}
              >
                One-time Event
              </button>
              <button
                className="rounded-xl border border-white/30 bg-white/10 px-5 py-4 text-white hover:bg-white/20"
                onClick={() => setSelectedMode("full_time")}
              >
                Full-time Club
              </button>
            </div>
          </div>
        )}

        {selectedMode && (
          <form onSubmit={createOwner} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white text-2xl font-semibold">
                {selectedMode === "one_time" ? "One-time Owner" : "Full-time Owner"}
              </h2>
              <button
                type="button"
                className="text-white/80 text-sm hover:text-white"
                onClick={() => {
                  setSelectedMode("");
                  setStatus("");
                }}
              >
                Change Mode
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                placeholder="Owner Name"
                className="w-full rounded-lg bg-white/90 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <input
                type="email"
                placeholder="Owner Email"
                className="w-full rounded-lg bg-white/90 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="password"
                placeholder="Password"
                className="w-full rounded-lg bg-white/90 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <input
                placeholder="Club Name"
                className="w-full rounded-lg bg-white/90 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400"
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
                required
              />
            </div>

            <div className="pt-2 flex items-center justify-between gap-4">
              <p className="text-white/80 text-sm min-h-5">{status}</p>
              <button
                type="submit"
                className="rounded-lg bg-indigo-500 px-5 py-2.5 text-white font-medium hover:bg-indigo-600 transition-colors"
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
