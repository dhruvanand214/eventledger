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

    await axios.post("/exit/close", {
      sessionId: session.id
    });

    setStatusMessage("Payment successful. Session closed.");
    setSession(null);
    setTotal(0);
    setShowInvoice(false);
    setScannerKey((k) => k + 1);
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
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/80">Exit Desk</p>
            <h2 className="mb-4 mt-2 text-xl font-semibold text-white">Scan Customer QR</h2>
            {statusMessage && <p className="mb-3 rounded-lg bg-emerald-500/20 px-3 py-2 text-sm text-emerald-200">{statusMessage}</p>}
            <QRScanner key={scannerKey} onScan={scanSuccess} />

            <div className="mt-4 flex flex-wrap gap-3">
              {session && (
                <button
                  className="rounded-lg bg-cyan-500 px-4 py-2 text-white hover:bg-cyan-600"
                  onClick={() => setScannerKey((k) => k + 1)}
                >
                  Scan Another QR
                </button>
              )}

              {session && (
                <button
                  className="rounded-lg bg-indigo-500 px-4 py-2 text-white hover:bg-indigo-600"
                  onClick={() => setShowInvoice(true)}
                >
                  Generate Invoice
                </button>
              )}
            </div>
          </div>
        }
        right={
          <div className="text-white">
            {!session && <h2 className="text-white/75">No active session</h2>}

            {session && (
              <>
                <h2 className="mb-3 text-xl font-semibold">Customer Bill</h2>
                <p>Name: {session.customerName}</p>
                <p>Session: {session.id}</p>
                <div className="mt-6 text-3xl font-bold">Total: Rs {total}</div>
                <button
                  className="mt-5 rounded-lg bg-rose-600 p-3 text-white hover:bg-rose-700"
                  onClick={closeSession}
                >
                  Mark Paid & Close Session
                </button>
              </>
            )}
          </div>
        }
      />

      {showInvoice && session && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl p-6 shadow-2xl text-white">
            <h2 className="text-xl font-semibold mb-3">Invoice Preview</h2>
            <p className="text-sm text-white/80 mb-1">Name: {invoiceData.customerName}</p>
            <p className="text-sm text-white/80 mb-1">Session: {invoiceData.sessionId}</p>
            <p className="text-sm text-white/80 mb-4">Date: {invoiceData.generatedAt}</p>
            <p className="text-2xl font-bold mb-5">Total: Rs {invoiceData.total}</p>

            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded bg-white/20 hover:bg-white/30"
                onClick={() => setShowInvoice(false)}
              >
                Close
              </button>
              <button
                className="px-4 py-2 rounded bg-indigo-500 hover:bg-indigo-600"
                onClick={printInvoice}
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
