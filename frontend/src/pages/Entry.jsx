import { useMemo, useState } from "react";
import axios from "../api/axios";
import GlassCard from "../components/GlassCard";

export default function Entry() {
  const [customerName, setCustomerName] = useState("");
  const [qrData, setQrData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const canGenerate = useMemo(() => customerName.trim().length > 0, [customerName]);

  const createSession = async () => {
    if (!canGenerate || isLoading) return;

    try {
      setIsLoading(true);
      setErrorMessage("");

      const res = await axios.post("/sessions", {
        customerName: customerName.trim()
      });

      setQrData({
        qrCode: res.data.qrCode,
        sessionId: res.data.sessionId,
        customerName: customerName.trim(),
        createdAt: new Date().toLocaleString()
      });
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || "Failed to generate QR");
    } finally {
      setIsLoading(false);
    }
  };

  const closeQrPopup = () => {
    setQrData(null);
    setCustomerName("");
    setErrorMessage("");
  };

  const printQr = () => {
    if (!qrData?.qrCode) return;

    const printWindow = window.open("", "_blank", "width=420,height=620");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Session QR</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 24px; }
            img { width: 240px; height: 240px; margin-top: 12px; }
            .meta { margin-top: 10px; color: #333; }
          </style>
        </head>
        <body>
          <h2>Customer QR</h2>
          <div class="meta"><strong>Name:</strong> ${qrData.customerName}</div>
          <div class="meta"><strong>Session:</strong> ${qrData.sessionId}</div>
          <div class="meta"><strong>Created:</strong> ${qrData.createdAt}</div>
          <img src="${qrData.qrCode}" alt="QR Code" />
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <>
      <div className="mx-auto w-full max-w-xl">
        <GlassCard>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/80">Entry Desk</p>
          <h1 className="text-white text-2xl mb-2 mt-2 font-semibold">Create Session</h1>
          <p className="text-white/80 text-sm mb-5">Enter customer name and generate printable QR.</p>

          <input
            className="p-3 rounded-lg w-full mb-3 bg-white/90 outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Customer Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />

          {errorMessage && <p className="text-red-200 text-sm mb-3">{errorMessage}</p>}

          <button
            className="bg-indigo-500 px-4 py-2.5 rounded-lg text-white font-medium disabled:opacity-60"
            onClick={createSession}
            disabled={!canGenerate || isLoading}
          >
            {isLoading ? "Generating..." : "Generate QR"}
          </button>
        </GlassCard>
      </div>

      {qrData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl p-6 shadow-2xl text-white">
            <h2 className="text-xl font-semibold mb-2">QR Generated</h2>
            <p className="text-white/80 text-sm">{qrData.customerName}</p>
            <p className="text-white/60 text-xs mb-4">Session: {qrData.sessionId}</p>

            <div className="bg-white p-3 rounded-lg inline-block">
              <img src={qrData.qrCode} alt="Generated QR" className="w-56 h-56" />
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                className="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30"
                onClick={closeQrPopup}
              >
                Close
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600"
                onClick={printQr}
              >
                Print
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
