import { useState } from "react";
import axios from "../api/axios";
import { useNavigate } from "react-router-dom";
import GlassCard from "../components/GlassCard";

export default function Login() {

  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");

  const navigate = useNavigate();

  const login = async () => {

    try{

      const res = await axios.post("/auth/login",{
        email,
        password
      });

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

      if(role === "admin") navigate("/admin");
      if(role === "owner") navigate("/owner");
      if(role === "bartender") navigate("/bartender");
      if(role === "exit") navigate("/exit");
      if(role === "entry") navigate("/entry");

    }catch (err) {
      const serverMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Login failed. Please try again.";
      alert(serverMessage);
    }

  };

  return (

    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#0f766e_0%,#155e75_38%,#0f172a_100%)] px-4">
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center">
        <GlassCard>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/80">Welcome</p>
          <h1 className="mb-5 mt-2 text-2xl font-semibold text-white">
            EventLedger Login
          </h1>

        <input
          className="mb-3 w-full rounded-lg bg-white/90 p-2.5"
          placeholder="Email"
          onChange={(e)=>setEmail(e.target.value)}
        />

        <input
          type="password"
          className="mb-4 w-full rounded-lg bg-white/90 p-2.5"
          placeholder="Password"
          onChange={(e)=>setPassword(e.target.value)}
        />

        <button
          onClick={login}
          className="w-full rounded-lg bg-cyan-500 px-4 py-2.5 font-medium text-white hover:bg-cyan-600"
        >
          Login
        </button>

        </GlassCard>
      </div>
    </div>
  );
}
