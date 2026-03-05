import { useState } from "react";
import axios from "../api/axios";
import GlassCard from "../components/GlassCard";

export default function Entry() {

  const [customerName,setCustomerName] = useState("");
  const [qr,setQr] = useState(null);

  const createSession = async () => {

    const res = await axios.post("/sessions", {
      customerName
    });

    setQr(res.data.qrCode);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-purple-700 to-indigo-800">

      <GlassCard>

        <h1 className="text-white text-xl mb-4">Create Session</h1>

        <input
          className="p-2 rounded w-full mb-3"
          placeholder="Customer Name"
          onChange={(e)=>setCustomerName(e.target.value)}
        />

        <button
          className="bg-indigo-500 px-4 py-2 rounded text-white"
          onClick={createSession}
        >
          Generate QR
        </button>

        {qr && (
          <img src={qr} className="mt-4"/>
        )}

      </GlassCard>

    </div>
  );
}