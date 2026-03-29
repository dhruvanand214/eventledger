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
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-[#908fa0] font-semibold">Entry Desk</p>
          <h1 className="mt-2 text-2xl font-bold gradient-text">Create Session</h1>
          <p className="mt-1 mb-6 text-sm text-[#c7c4d7]">Enter customer name and generate a printable QR code.</p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-[#c7c4d7] mb-1.5 font-medium">Customer Name</label>
              <input
                id="entry-customer-name"
                className="input-nocturne"
                placeholder="Enter customer name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createSession()}
              />
            </div>

            {errorMessage && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-sm text-rose-300">
                {errorMessage}
              </div>
            )}

            <button
              id="entry-generate-qr-btn"
              className="btn-primary w-full py-3"
              onClick={createSession}
              disabled={!canGenerate || isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Generating...
                </span>
              ) : (
                "Generate QR Code"
              )}
            </button>
          </div>
        </GlassCard>
      </div>

      {qrData && (
        <div className="modal-backdrop">
          <div className="modal-panel max-w-md text-center">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-[#e4dfff]">QR Generated</h2>
                <p className="text-sm text-[#c7c4d7] mt-0.5">{qrData.customerName}</p>
              </div>
              <span className="chip chip-emerald">
                <span className="live-dot" />
                Active
              </span>
            </div>

            <p className="text-[0.7rem] text-[#908fa0] mb-5 font-mono">Session: {qrData.sessionId}</p>

            {/* QR Code */}
            <div className="inline-block rounded-2xl p-4 mb-6" style={{ background: "white" }}>
              <img src={qrData.qrCode} alt="Generated QR" className="w-52 h-52 block" />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                id="entry-close-qr-btn"
                className="btn-ghost"
                onClick={closeQrPopup}
              >
                Close
              </button>
              <button
                id="entry-print-qr-btn"
                className="btn-primary"
                onClick={printQr}
              >
                Print QR
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
