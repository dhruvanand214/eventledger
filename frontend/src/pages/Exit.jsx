import { useMemo, useState } from "react";
import axios from "../api/axios";
import QRScanner from "../components/QRScanner";
import POSLayout from "../components/POSLayout";

export default function Exit() {
  const [session, setSession] = useState(null);
  const [total, setTotal] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [scannerKey, setScannerKey] = useState(0);
  const [showInvoice, setShowInvoice] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const invoiceData = useMemo(
    () => ({
      customerName: session?.customerName || "-",
      sessionId: session?.id || "-",
      total: Number(total || 0),
      generatedAt: new Date().toLocaleString()
    }),
    [session, total]
  );

  const scanSuccess = async (sessionId) => {
    try {
      const res = await axios.get(`/sessions/${sessionId}`);
      setSession({ id: sessionId, ...res.data });
      setTotal(Number(res.data.total || 0));
      setStatusMessage("");
      return true;
    } catch (error) {
      const message = error?.response?.data?.message;
      if (message === "Session not found") {
        setStatusMessage("This session is already closed. Scan another QR.");
      } else {
        setStatusMessage("Unable to load session. Please try again.");
      }
      return false;
    }
  };

  const closeSession = async () => {
    if (!session) return;
    try {
      setIsClosing(true);
      await axios.post("/exit/close", { sessionId: session.id });
      setStatusMessage("Payment successful. Session closed.");
      setSession(null);
      setTotal(0);
      setShowInvoice(false);
      setScannerKey((k) => k + 1);
    } finally {
      setIsClosing(false);
    }
  };

  const printInvoice = () => {
    const printWindow = window.open("", "_blank", "width=420,height=620");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            h2 { margin-bottom: 16px; }
            .row { margin: 8px 0; }
            .total { margin-top: 18px; font-size: 20px; font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>Customer Invoice</h2>
          <div class="row"><strong>Name:</strong> ${invoiceData.customerName}</div>
          <div class="row"><strong>Session:</strong> ${invoiceData.sessionId}</div>
          <div class="row"><strong>Date:</strong> ${invoiceData.generatedAt}</div>
          <div class="total">Total: Rs ${invoiceData.total}</div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <>
      <POSLayout
        left={
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.2em] text-[#908fa0] font-semibold">Exit Desk</p>
            <h2 className="mt-2 mb-5 text-xl font-bold gradient-text">Scan Customer QR</h2>

            {statusMessage && (
              <div className="mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-300">
                {statusMessage}
              </div>
            )}

            <QRScanner key={scannerKey} onScan={scanSuccess} />

            <div className="mt-5 flex flex-wrap gap-3">
              {session && (
                <button
                  id="exit-scan-another-btn"
                  className="btn-ghost"
                  onClick={() => setScannerKey((k) => k + 1)}
                >
                  Scan Another QR
                </button>
              )}
              {session && (
                <button
                  id="exit-generate-invoice-btn"
                  className="btn-primary"
                  onClick={() => setShowInvoice(true)}
                >
                  Generate Invoice
                </button>
              )}
            </div>
          </div>
        }
        right={
          <div className="text-[#e4dfff]">
            <p className="text-[0.65rem] uppercase tracking-[0.2em] text-[#908fa0] font-semibold">Customer Bill</p>

            {!session && (
              <div className="mt-8 flex flex-col items-center justify-center text-center py-12">
                <div className="h-16 w-16 rounded-2xl bg-[rgba(52,49,80,0.5)] flex items-center justify-center mb-4">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M9 17H7A5 5 0 017 7h2M15 17h2a5 5 0 000-10h-2M9 12h6" stroke="#908fa0" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <p className="text-[#c7c4d7] font-medium">No Active Session</p>
                <p className="text-sm text-[#908fa0] mt-1">Scan a customer QR to load their bill</p>
              </div>
            )}

            {session && (
              <div className="mt-4 animate-slide-up">
                <div className="rounded-2xl bg-[rgba(41,38,68,0.6)] border border-[rgba(70,69,84,0.3)] p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-[#e4dfff]">{session.customerName}</p>
                      <p className="text-[0.7rem] text-[#908fa0] font-mono mt-0.5">{session.id}</p>
                    </div>
                    <span className="chip chip-cyan">Active</span>
                  </div>
                </div>

                <div className="rounded-2xl stat-amber border border-[rgba(70,69,84,0.3)] p-6 text-center mb-5">
                  <p className="text-xs uppercase tracking-wider text-[#908fa0] font-semibold mb-2">Total Bill</p>
                  <p className="text-4xl font-bold text-amber-300">Rs {total.toLocaleString("en-IN")}</p>
                </div>

                <button
                  id="exit-mark-paid-btn"
                  className="btn-rose w-full py-3 text-sm"
                  onClick={closeSession}
                  disabled={isClosing}
                >
                  {isClosing ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    "Mark Paid & Close Session"
                  )}
                </button>
              </div>
            )}
          </div>
        }
      />

      {showInvoice && session && (
        <div className="modal-backdrop">
          <div className="modal-panel max-w-md">
            <h2 className="text-xl font-bold text-[#e4dfff] mb-4">Invoice Preview</h2>

            <div className="rounded-2xl bg-[rgba(52,49,80,0.4)] border border-[rgba(70,69,84,0.3)] p-4 mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#908fa0]">Customer</span>
                <span className="text-[#e4dfff] font-medium">{invoiceData.customerName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#908fa0]">Session</span>
                <span className="text-[#c7c4d7] font-mono text-xs">{invoiceData.sessionId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#908fa0]">Date</span>
                <span className="text-[#c7c4d7]">{invoiceData.generatedAt}</span>
              </div>
              <div className="pt-2 border-t border-[rgba(70,69,84,0.3)] flex justify-between">
                <span className="font-semibold text-[#c7c4d7]">Total</span>
                <span className="text-2xl font-bold text-amber-300">Rs {invoiceData.total.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                id="exit-close-invoice-btn"
                className="btn-ghost"
                onClick={() => setShowInvoice(false)}
              >
                Close
              </button>
              <button
                id="exit-print-invoice-btn"
                className="btn-primary"
                onClick={printInvoice}
              >
                Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
