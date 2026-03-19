import { useEffect, useMemo, useRef, useState } from "react";
import axios from "../api/axios";
import QRScanner from "../components/QRScanner";
import POSLayout from "../components/POSLayout";
import socket from "../socket/socket";
import { getClubId, getEventId } from "../utils/auth";

export default function Bartender() {
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [menu, setMenu] = useState([]);
  const [scannerKey, setScannerKey] = useState(0);

  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [draftItems, setDraftItems] = useState({});
  const scanningLockRef = useRef(false);
  const lastFailedScanRef = useRef({ id: "", at: 0 });

  const selectedSession = useMemo(
    () => sessions.find((s) => s.id === selectedSessionId) || null,
    [sessions, selectedSessionId]
  );

  const groupedMenu = useMemo(() => {
    return menu.reduce((acc, item) => {
      const category = item.category || "General";
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {});
  }, [menu]);

  const categoryList = useMemo(() => Object.keys(groupedMenu), [groupedMenu]);

  const summaryRows = useMemo(() => Object.values(draftItems), [draftItems]);
  const summaryTotal = useMemo(
    () => summaryRows.reduce((sum, row) => sum + row.price * row.quantity, 0),
    [summaryRows]
  );

  const loadMenu = async () => {
    try {
      const res = await axios.get("/orders/menu");
      setMenu(res.data);
    } catch {
      setMenu([]);
    }
  };

  const loadActiveSessions = async () => {
    try {
      const res = await axios.get("/sessions");
      const activeSessions = (res.data || []).map((session) => ({
        ...session,
        total: Number(session.total || 0)
      }));
      setSessions(activeSessions);
      if (activeSessions.length > 0) {
        setSelectedSessionId((current) => current || activeSessions[0].id);
      }
    } catch {
      setSessions([]);
    }
  };

  useEffect(() => {
    const handleSessionClosed = (data) => {
      if ((getClubId() || "default-club") !== (data.clubId || "default-club")) return;
      if ((getEventId() || "default-event") !== (data.eventId || "default-event")) return;

      setSessions((current) => current.filter((s) => s.id !== data.sessionId));
      setSelectedSessionId((currentSelected) =>
        currentSelected === data.sessionId ? null : currentSelected
      );
      setStatusMessage("Bill paid. Session closed at exit counter.");
    };

    socket.on("session.closed", handleSessionClosed);
    return () => socket.off("session.closed", handleSessionClosed);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadActiveSessions();
      loadMenu();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const scanSuccess = async (sessionId) => {
    const now = Date.now();
    const isImmediateDuplicateFailure =
      lastFailedScanRef.current.id === sessionId &&
      now - lastFailedScanRef.current.at < 1500;

    if (scanningLockRef.current || isImmediateDuplicateFailure) {
      return false;
    }

    scanningLockRef.current = true;
    try {
      const res = await axios.get(`/sessions/${sessionId}`);

      const freshSession = {
        id: sessionId,
        ...res.data,
        total: Number(res.data.total || 0)
      };

      setSessions((current) => {
        const exists = current.some((s) => s.id === sessionId);
        if (exists) return current.map((s) => (s.id === sessionId ? freshSession : s));
        return [freshSession, ...current];
      });

      setSelectedSessionId(sessionId);
      setStatusMessage("");
      return true;
    } catch (error) {
      const message = error?.response?.data?.message;
      lastFailedScanRef.current = { id: sessionId, at: Date.now() };
      if (message === "Session not found") {
        setStatusMessage("This session is already closed. Scan another QR.");
      } else {
        setStatusMessage("Unable to load session. Please scan again.");
      }
      return false;
    } finally {
      scanningLockRef.current = false;
    }
  };

  const refreshSession = async (sessionId) => {
    const res = await axios.get(`/sessions/${sessionId}`);
    setSessions((current) =>
      current.map((s) =>
        s.id === sessionId ? { ...s, ...res.data, total: Number(res.data.total || 0) } : s
      )
    );
  };

  const openAddItemModal = () => {
    if (!selectedSession) {
      setStatusMessage("Select a customer tile first.");
      return;
    }
    setDraftItems({});
    setSelectedCategory(categoryList[0] || "");
    setShowAddItemModal(true);
  };

  const addDraftItem = (item) => {
    setDraftItems((current) => {
      const key = `${item.itemName}-${item.price}`;
      const existing = current[key];
      return {
        ...current,
        [key]: {
          itemName: item.itemName,
          price: Number(item.price),
          quantity: existing ? existing.quantity + 1 : 1
        }
      };
    });
  };

  const updateQuantity = (key, delta) => {
    setDraftItems((current) => {
      const row = current[key];
      if (!row) return current;
      const nextQty = row.quantity + delta;
      if (nextQty <= 0) {
        const clone = { ...current };
        delete clone[key];
        return clone;
      }
      return {
        ...current,
        [key]: { ...row, quantity: nextQty }
      };
    });
  };

  const confirmAddItems = async () => {
    if (!selectedSession || summaryRows.length === 0) {
      setShowAddItemModal(false);
      return;
    }

    for (const row of summaryRows) {
      await axios.post("/orders/add", {
        sessionId: selectedSession.id,
        itemName: row.itemName,
        price: row.price,
        quantity: row.quantity
      });
    }

    await refreshSession(selectedSession.id);
    setShowAddItemModal(false);
    setDraftItems({});
    setStatusMessage("Items added successfully.");
  };

  return (
    <>
      <POSLayout
        left={
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/80">Bartender Desk</p>
            <h2 className="mb-4 mt-2 text-xl font-semibold text-white">Scan Customer QR</h2>
            {statusMessage && <p className="mb-3 rounded-lg bg-emerald-500/20 px-3 py-2 text-sm text-emerald-200">{statusMessage}</p>}
            <QRScanner key={scannerKey} onScan={scanSuccess} />

            <div className="mt-4 flex flex-wrap gap-3">
              {sessions.length > 0 && (
                <button
                  className="rounded-lg bg-cyan-500 px-4 py-2 text-white hover:bg-cyan-600"
                  onClick={() => setScannerKey((k) => k + 1)}
                >
                  Scan Another QR
                </button>
              )}
              <button
                className="rounded-lg bg-indigo-500 px-4 py-2 text-white hover:bg-indigo-600"
                onClick={openAddItemModal}
              >
                Add Item
              </button>
            </div>
          </div>
        }
        right={
          <div className="text-white">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/80">Live Queue</p>
            <h2 className="mb-3 mt-2 text-xl font-semibold">Active Customers</h2>
            {sessions.length === 0 && <p className="text-white/75">No active session</p>}

            <div className="space-y-3 max-h-[70vh] overflow-auto pr-1">
              {sessions.map((s) => (
                <button
                  key={s.id}
                  className={`w-full text-left rounded p-3 border ${
                    selectedSessionId === s.id
                      ? "border-cyan-200/70 bg-cyan-500/25"
                      : "border-white/20 bg-white/10"
                  }`}
                  onClick={() => setSelectedSessionId(s.id)}
                >
                  <p className="font-semibold">{s.customerName}</p>
                  <p className="text-sm">Session: {s.id}</p>
                  <p className="text-sm">Total: Rs {Number(s.total || 0)}</p>
                </button>
              ))}
            </div>
          </div>
        }
      />

      {showAddItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl p-6 shadow-2xl text-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Add Items</h2>
              <button
                className="rounded-lg bg-white/20 px-3 py-1 hover:bg-white/30"
                onClick={() => setShowAddItemModal(false)}
              >
                Close
              </button>
            </div>

            <p className="text-white/80 text-sm mb-4">
              Customer: {selectedSession?.customerName} ({selectedSession?.id})
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Categories</h3>
                {categoryList.map((category) => (
                  <button
                    key={category}
                    className={`w-full text-left rounded-lg px-3 py-2 ${
                      selectedCategory === category ? "bg-cyan-500" : "bg-white/20"
                    }`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="space-y-2 md:col-span-1">
                <h3 className="font-semibold">Items</h3>
                {(groupedMenu[selectedCategory] || []).map((item) => (
                  <button
                    key={item._id}
                    className="w-full text-left rounded-lg bg-cyan-500/80 px-3 py-2 hover:bg-cyan-500"
                    onClick={() => addDraftItem(item)}
                  >
                    {item.itemName} - Rs {item.price}
                  </button>
                ))}
              </div>

              <div className="space-y-2 md:col-span-1">
                <h3 className="font-semibold">Summary</h3>
                <div className="max-h-56 overflow-auto pr-1">
                  {summaryRows.length === 0 && <p className="text-white/70 text-sm">No items selected.</p>}
                  {Object.entries(draftItems).map(([key, row]) => (
                    <div key={key} className="py-2 border-b border-white/20">
                      <p>{row.itemName}</p>
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center gap-2">
                          <button
                            className="w-7 h-7 rounded bg-white/20"
                            onClick={() => updateQuantity(key, -1)}
                          >
                            -
                          </button>
                          <span>{row.quantity}</span>
                          <button
                            className="w-7 h-7 rounded bg-white/20"
                            onClick={() => updateQuantity(key, 1)}
                          >
                            +
                          </button>
                        </div>
                        <span className="text-sm">Rs {row.quantity * row.price}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="font-semibold mt-2">Total: Rs {summaryTotal}</p>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3">
                <button
                className="rounded-lg bg-white/20 px-4 py-2 hover:bg-white/30"
                onClick={() => setDraftItems({})}
              >
                Clear
              </button>
              <button
                className="rounded-lg bg-indigo-500 px-4 py-2 hover:bg-indigo-600"
                onClick={confirmAddItems}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
