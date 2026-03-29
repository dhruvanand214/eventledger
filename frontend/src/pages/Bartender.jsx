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
            <p className="text-[0.65rem] uppercase tracking-[0.2em] text-[#908fa0] font-semibold">Bartender Desk</p>
            <h2 className="mt-2 mb-5 text-xl font-bold gradient-text">Scan Customer QR</h2>

            {statusMessage && (
              <div className="mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-300">
                {statusMessage}
              </div>
            )}

            <QRScanner key={scannerKey} onScan={scanSuccess} />

            <div className="mt-5 flex flex-wrap gap-3">
              {sessions.length > 0 && (
                <button
                  id="bartender-scan-another-btn"
                  className="btn-ghost"
                  onClick={() => setScannerKey((k) => k + 1)}
                >
                  Scan Another QR
                </button>
              )}
              <button
                id="bartender-add-item-btn"
                className="btn-primary"
                onClick={openAddItemModal}
              >
                Add Item
              </button>
            </div>
          </div>
        }
        right={
          <div className="text-[#e4dfff]">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.2em] text-[#908fa0] font-semibold">Live Queue</p>
                <h2 className="mt-1 text-xl font-bold gradient-text">Active Customers</h2>
              </div>
              {sessions.length > 0 && (
                <span className="chip chip-cyan">
                  <span className="live-dot" />
                  {sessions.length} Active
                </span>
              )}
            </div>

            {sessions.length === 0 && (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="h-16 w-16 rounded-2xl bg-[rgba(52,49,80,0.5)] flex items-center justify-center mb-4">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="#908fa0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="text-[#c7c4d7] font-medium">No Active Sessions</p>
                <p className="text-sm text-[#908fa0] mt-1">Scan a customer QR to get started</p>
              </div>
            )}

            <div className="space-y-2 max-h-[60vh] overflow-auto pr-1">
              {sessions.map((s) => (
                <button
                  key={s.id}
                  id={`bartender-session-${s.id}`}
                  className={`w-full text-left rounded-2xl p-3.5 border transition-all duration-200 ${
                    selectedSessionId === s.id
                      ? "border-indigo-500/40 bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.15)]"
                      : "border-[rgba(70,69,84,0.3)] bg-[rgba(52,49,80,0.3)] hover:bg-[rgba(52,49,80,0.5)]"
                  }`}
                  onClick={() => setSelectedSessionId(s.id)}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-[#e4dfff]">{s.customerName}</p>
                    <span className="text-amber-300 font-bold text-sm">Rs {Number(s.total || 0).toLocaleString("en-IN")}</span>
                  </div>
                  <p className="text-[0.65rem] text-[#908fa0] font-mono mt-0.5 truncate">{s.id}</p>
                </button>
              ))}
            </div>
          </div>
        }
      />

      {showAddItemModal && (
        <div className="modal-backdrop">
          <div className="modal-panel max-w-3xl w-full">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h2 className="text-xl font-bold text-[#e4dfff]">Add Items</h2>
                <p className="text-sm text-[#c7c4d7] mt-0.5">
                  {selectedSession?.customerName}
                  <span className="text-[#908fa0] font-mono text-xs ml-2">({selectedSession?.id})</span>
                </p>
              </div>
              <button
                id="bartender-close-modal-btn"
                className="btn-ghost text-xs px-3 py-1.5"
                onClick={() => setShowAddItemModal(false)}
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {/* Categories */}
              <div className="space-y-1.5">
                <p className="text-xs uppercase tracking-wider text-[#908fa0] font-semibold mb-3">Categories</p>
                {categoryList.map((category) => (
                  <button
                    key={category}
                    id={`bartender-category-${category}`}
                    className={`w-full text-left rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                      selectedCategory === category
                        ? "bg-indigo-500/20 border border-indigo-500/30 text-indigo-300"
                        : "bg-[rgba(52,49,80,0.4)] border border-[rgba(70,69,84,0.2)] text-[#c7c4d7] hover:bg-[rgba(52,49,80,0.7)]"
                    }`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {/* Items */}
              <div className="space-y-1.5">
                <p className="text-xs uppercase tracking-wider text-[#908fa0] font-semibold mb-3">Items</p>
                <div className="space-y-1.5 max-h-64 overflow-auto pr-1">
                  {(groupedMenu[selectedCategory] || []).map((item) => (
                    <button
                      key={item._id}
                      id={`bartender-item-${item._id}`}
                      className="w-full text-left rounded-xl px-3 py-2.5 bg-[rgba(99,102,241,0.1)] border border-indigo-500/20 hover:bg-indigo-500/20 hover:border-indigo-500/30 transition-all duration-200"
                      onClick={() => addDraftItem(item)}
                    >
                      <p className="text-sm font-medium text-[#e4dfff]">{item.itemName}</p>
                      <p className="text-xs text-amber-300 font-semibold mt-0.5">Rs {Number(item.price).toLocaleString("en-IN")}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div>
                <p className="text-xs uppercase tracking-wider text-[#908fa0] font-semibold mb-3">Order Summary</p>
                <div className="space-y-1.5 max-h-52 overflow-auto pr-1">
                  {summaryRows.length === 0 && (
                    <p className="text-sm text-[#908fa0] italic">No items selected yet.</p>
                  )}
                  {Object.entries(draftItems).map(([key, row]) => (
                    <div key={key} className="rounded-xl bg-[rgba(52,49,80,0.4)] border border-[rgba(70,69,84,0.3)] p-3">
                      <p className="text-sm font-medium text-[#e4dfff] mb-2">{row.itemName}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            className="w-7 h-7 rounded-lg bg-[rgba(52,49,80,0.7)] text-[#c7c4d7] hover:bg-indigo-500/20 transition-colors text-sm font-bold"
                            onClick={() => updateQuantity(key, -1)}
                          >
                            −
                          </button>
                          <span className="text-sm font-semibold text-[#e4dfff] w-5 text-center">{row.quantity}</span>
                          <button
                            className="w-7 h-7 rounded-lg bg-[rgba(52,49,80,0.7)] text-[#c7c4d7] hover:bg-indigo-500/20 transition-colors text-sm font-bold"
                            onClick={() => updateQuantity(key, 1)}
                          >
                            +
                          </button>
                        </div>
                        <span className="text-sm font-bold text-amber-300">Rs {(row.quantity * row.price).toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {summaryRows.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[rgba(70,69,84,0.3)] flex justify-between items-center">
                    <span className="text-sm text-[#c7c4d7] font-semibold">Total</span>
                    <span className="text-lg font-bold text-amber-300">Rs {summaryTotal.toLocaleString("en-IN")}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                id="bartender-clear-items-btn"
                className="btn-ghost"
                onClick={() => setDraftItems({})}
              >
                Clear
              </button>
              <button
                id="bartender-confirm-items-btn"
                className="btn-primary"
                onClick={confirmAddItems}
                disabled={summaryRows.length === 0}
              >
                Confirm Order
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
