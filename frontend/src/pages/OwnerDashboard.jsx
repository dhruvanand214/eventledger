import { useCallback, useEffect, useMemo, useState } from "react";
import socket from "../socket/socket";
import GlassCard from "../components/GlassCard";
import axios from "../api/axios";
import {
  getClubId,
  getClubName,
  getEventId,
  getEventName,
  getRole,
  getServiceType,
  isEventActive,
  logout
} from "../utils/auth";

const toEventId = (name) => {
  const base = String(name || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${base || "event"}-${Date.now()}`;
};

const formatDuration = (ms) => {
  if (!ms || ms < 0) return "-";
  const min = Math.round(ms / 60000);
  return `${min} min`;
};

const formatCurrency = (value) => `Rs ${Number(value || 0).toLocaleString("en-IN")}`;

const getOwnerContext = () => ({
  role: getRole() || "",
  serviceType: getServiceType() || "full_time",
  eventActive: isEventActive(),
  clubId: getClubId() || "-",
  clubName: getClubName() || "-",
  eventId: getEventId() || "-",
  eventName: getEventName() || "-"
});

const menuSteps = {
  HOME: "home",
  CATEGORY: "category",
  ITEM: "item",
  UPLOAD: "upload"
};

export default function OwnerDashboard() {
  const [orders, setOrders] = useState([]);
  const [revenue, setRevenue] = useState(0);
  const [sessions, setSessions] = useState(0);

  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);

  const [newCategory, setNewCategory] = useState("");
  const [itemName, setItemName] = useState("");
  const [price, setPrice] = useState("");
  const [itemCategory, setItemCategory] = useState("");
  const [menuFile, setMenuFile] = useState(null);
  const [menuStatus, setMenuStatus] = useState("");

  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [staffRole, setStaffRole] = useState("bartender");
  const [staffStatus, setStaffStatus] = useState("");

  const [showModifyMenuModal, setShowModifyMenuModal] = useState(false);
  const [menuStep, setMenuStep] = useState(menuSteps.HOME);
  const [showViewMenuModal, setShowViewMenuModal] = useState(false);

  const [newEventName, setNewEventName] = useState("");
  const [eventActionStatus, setEventActionStatus] = useState("");
  const [dailySummary, setDailySummary] = useState([]);
  const [eventHistory, setEventHistory] = useState([]);

  const [ownerContext, setOwnerContext] = useState(getOwnerContext);

  const canManageStaff = ownerContext.role === "owner";

  const refreshOwnerContext = useCallback(() => {
    setOwnerContext(getOwnerContext());
  }, []);

  const loadMenuData = useCallback(async () => {
    const [menuRes, categoryRes] = await Promise.all([
      axios.get("/orders/menu"),
      axios.get("/orders/menu/categories")
    ]);

    setMenu(menuRes.data || []);
    setCategories(categoryRes.data || []);

    if (!itemCategory && categoryRes.data?.length > 0) {
      setItemCategory(categoryRes.data[0].name);
    }
  }, [itemCategory]);

  const loadSummaries = useCallback(async () => {
    try {
      const dailyRes = await axios.get("/exit/summary/daily");
      setDailySummary(dailyRes.data || []);
    } catch {
      setDailySummary([]);
    }

    try {
      const eventRes = await axios.get("/exit/summary/events");
      setEventHistory(eventRes.data || []);
    } catch {
      setEventHistory([]);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadMenuData();
      loadSummaries();
    }, 0);

    const handleOrderCreated = (data) => {
      if ((data.clubId || "default-club") !== (getClubId() || "default-club")) return;
      if ((data.eventId || "default-event") !== (getEventId() || "default-event")) return;
      setOrders((prev) => [data, ...prev.slice(0, 11)]);
    };

    const handleSessionClosed = (data) => {
      if ((data.clubId || "default-club") !== (getClubId() || "default-club")) return;
      if ((data.eventId || "default-event") !== (getEventId() || "default-event")) return;
      setRevenue((prev) => prev + Number(data.total || 0));
      setSessions((prev) => Math.max(prev - 1, 0));
    };

    const handleSessionCreated = (data) => {
      if ((data.clubId || "default-club") !== (getClubId() || "default-club")) return;
      if ((data.eventId || "default-event") !== (getEventId() || "default-event")) return;
      setSessions((prev) => prev + 1);
    };

    socket.on("order.created", handleOrderCreated);
    socket.on("session.closed", handleSessionClosed);
    socket.on("session.created", handleSessionCreated);

    return () => {
      clearTimeout(timer);
      socket.off("order.created", handleOrderCreated);
      socket.off("session.closed", handleSessionClosed);
      socket.off("session.created", handleSessionCreated);
    };
  }, [loadMenuData, loadSummaries]);

  const groupedMenu = useMemo(() => {
    return menu.reduce((acc, item) => {
      const category = item.category || "General";
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {});
  }, [menu]);

  const bindEvent = async (eventName) => {
    const trimmed = eventName.trim();
    if (!trimmed) {
      setEventActionStatus("Event name is required.");
      return;
    }

    const payload = {
      eventId: toEventId(trimmed),
      eventName: trimmed
    };

    try {
      const res = await axios.post("/auth/event/bind", payload);
      const { token, user } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("role", user.role);
      localStorage.setItem("clubId", user.clubId || "");
      localStorage.setItem("clubName", user.clubName || "");
      localStorage.setItem("eventId", user.eventId || "");
      localStorage.setItem("eventName", user.eventName || "");
      localStorage.setItem("serviceType", user.serviceType || "full_time");
      localStorage.setItem("isEventActive", String(Boolean(user.isEventActive)));

      setEventActionStatus("Event started successfully.");
      setNewEventName("");
      refreshOwnerContext();
      await loadSummaries();
    } catch (err) {
      setEventActionStatus(err?.response?.data?.message || "Failed to start event");
    }
  };

  const closeEvent = async () => {
    try {
      await axios.post("/auth/close-event");
      setEventActionStatus("Event ended. Staff sessions closed.");
      localStorage.setItem("isEventActive", "false");
      localStorage.setItem("eventId", "");
      localStorage.setItem("eventName", "");
      refreshOwnerContext();
      await loadSummaries();
    } catch (err) {
      setEventActionStatus(err?.response?.data?.message || "Failed to end event");
    }
  };

  const createCategory = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/orders/menu/categories", { name: newCategory });
      setMenuStatus("Category saved.");
      setNewCategory("");
      await loadMenuData();
    } catch (err) {
      setMenuStatus(err?.response?.data?.message || "Failed to save category");
    }
  };

  const createMenuItem = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/orders/menu", {
        category: itemCategory,
        itemName,
        price: Number(price)
      });
      setItemName("");
      setPrice("");
      setMenuStatus("Menu item saved.");
      await loadMenuData();
    } catch (err) {
      setMenuStatus(err?.response?.data?.message || "Failed to save menu item");
    }
  };

  const uploadMenuFile = async (e) => {
    e.preventDefault();
    if (!menuFile) {
      setMenuStatus("Select a file first.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("menuFile", menuFile);
      await axios.post("/orders/menu/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setMenuFile(null);
      setMenuStatus("Menu file uploaded.");
      await loadMenuData();
    } catch (err) {
      setMenuStatus(err?.response?.data?.message || "Failed to upload menu file");
    }
  };

  const createStaff = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/auth/register", {
        name: staffName,
        email: staffEmail,
        password: staffPassword,
        role: staffRole
      });
      setStaffStatus("Staff created successfully.");
      setStaffName("");
      setStaffEmail("");
      setStaffPassword("");
      setStaffRole("bartender");
    } catch (err) {
      setStaffStatus(err?.response?.data?.message || "Failed to create staff");
    }
  };

  const openModifyMenu = () => {
    setMenuStatus("");
    setMenuStep(menuSteps.HOME);
    setShowModifyMenuModal(true);
  };

  const closeModifyMenu = () => {
    setMenuStep(menuSteps.HOME);
    setShowModifyMenuModal(false);
  };

  return (
    <div className="w-full animate-fade-in">
      <div className="mx-auto w-full max-w-7xl space-y-5">

        {/* Header card */}
        <div className="glass-card p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[0.65rem] uppercase tracking-[0.2em] text-[#908fa0] font-semibold">Control Center</p>
              <h1 className="mt-2 text-3xl font-bold gradient-text md:text-4xl">Owner Dashboard</h1>
              <p className="mt-2 text-sm text-[#c7c4d7]">
                {ownerContext.clubName}
                {ownerContext.eventName !== "-" && ownerContext.eventName
                  ? <span className="text-[#908fa0]"> • {ownerContext.eventName}</span>
                  : ""}
              </p>
              <div className="mt-3">
                <span className="chip chip-indigo">
                  {ownerContext.serviceType === "one_time" ? "One-time Event" : "Full-time Club"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <button id="owner-modify-menu-btn" className="btn-primary text-xs" onClick={openModifyMenu}>
                Modify Menu
              </button>
              <button
                id="owner-view-menu-btn"
                className="btn-ghost text-xs"
                onClick={() => setShowViewMenuModal(true)}
              >
                View Menu
              </button>
              {canManageStaff && (
                <button
                  id="owner-add-staff-btn"
                  className="btn-emerald text-xs"
                  onClick={() => setShowStaffModal(true)}
                >
                  Add Staff
                </button>
              )}
              {ownerContext.serviceType === "one_time" && ownerContext.eventActive && (
                <button id="owner-end-event-btn" className="btn-rose text-xs" onClick={closeEvent}>
                  End Event
                </button>
              )}
              <button
                id="owner-logout-btn"
                className="btn-ghost text-xs"
                onClick={() => { logout(); window.location.href = "/"; }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="glass-card stat-amber p-5 text-[#e4dfff]">
            <p className="text-[0.65rem] uppercase tracking-wider text-[#908fa0] font-semibold">Revenue</p>
            <p className="mt-3 text-3xl font-bold text-amber-300">{formatCurrency(revenue)}</p>
            <p className="mt-1 text-xs text-[#908fa0]">This session</p>
          </div>
          <div className="glass-card stat-cyan p-5 text-[#e4dfff]">
            <p className="text-[0.65rem] uppercase tracking-wider text-[#908fa0] font-semibold">Active Sessions</p>
            <p className="mt-3 text-3xl font-bold text-[#4cd7f6]">{sessions}</p>
            <p className="mt-1 text-xs text-[#908fa0]">Guests in venue</p>
          </div>
          <div className="glass-card stat-violet p-5 text-[#e4dfff]">
            <p className="text-[0.65rem] uppercase tracking-wider text-[#908fa0] font-semibold">Live Orders</p>
            <p className="mt-3 text-3xl font-bold text-violet-300">{orders.length}</p>
            <p className="mt-1 text-xs text-[#908fa0]">Real-time feed</p>
          </div>
        </div>

        {eventActionStatus && (
          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-5 py-3.5 text-sm text-emerald-300">
            {eventActionStatus}
          </div>
        )}

        {/* Main content grid */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
          {/* Left panel */}
          <div className="space-y-5 lg:col-span-2">
            {ownerContext.serviceType === "one_time" && !ownerContext.eventActive && (
              <GlassCard>
                <p className="text-[0.65rem] uppercase tracking-wider text-[#908fa0] font-semibold mb-3">New Event</p>
                <h2 className="text-xl font-bold text-[#e4dfff] mb-1">Start New Event</h2>
                <p className="mb-4 text-sm text-[#c7c4d7]">Your last event is closed. Start a new one to continue.</p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    id="owner-event-name-input"
                    className="input-nocturne"
                    placeholder="Enter event name"
                    value={newEventName}
                    onChange={(e) => setNewEventName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && bindEvent(newEventName)}
                  />
                  <button
                    id="owner-start-event-btn"
                    className="btn-primary whitespace-nowrap"
                    onClick={() => bindEvent(newEventName)}
                  >
                    Start Event
                  </button>
                </div>
              </GlassCard>
            )}

            {ownerContext.serviceType === "one_time" && ownerContext.eventActive && (
              <GlassCard>
                <p className="text-[0.65rem] uppercase tracking-wider text-[#908fa0] font-semibold mb-3">Active Event</p>
                <h2 className="text-xl font-bold text-[#e4dfff]">{ownerContext.eventName || "Unnamed Event"}</h2>
                <p className="mt-1 text-[0.7rem] text-[#908fa0] font-mono">{ownerContext.eventId || "-"}</p>
                <div className="mt-3">
                  <span className="chip chip-emerald">
                    <span className="live-dot" />
                    Live
                  </span>
                </div>
              </GlassCard>
            )}

            {ownerContext.serviceType === "one_time" && !ownerContext.eventActive && eventHistory.length > 0 && (
              <GlassCard>
                <p className="text-[0.65rem] uppercase tracking-wider text-[#908fa0] font-semibold mb-3">History</p>
                <h2 className="text-xl font-bold text-[#e4dfff] mb-4">Past Events</h2>
                <div className="space-y-2">
                  {eventHistory.length === 0 && <p className="text-sm text-[#908fa0]">No past events found.</p>}
                  {eventHistory.map((row) => (
                    <div
                      key={`${row._id.eventId}-${row.lastExitTime}`}
                      className="rounded-xl bg-[rgba(52,49,80,0.4)] border border-[rgba(70,69,84,0.3)] p-4"
                    >
                      <p className="font-semibold text-[#e4dfff]">{row._id.eventName}</p>
                      <p className="text-[0.65rem] text-[#908fa0] font-mono mt-0.5">{row._id.eventId}</p>
                      <div className="mt-2 flex justify-between text-sm">
                        <span className="text-[#c7c4d7]">{row.sessions} sessions</span>
                        <span className="text-amber-300 font-bold">{formatCurrency(row.revenue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {ownerContext.serviceType === "full_time" && (
              <GlassCard>
                <p className="text-[0.65rem] uppercase tracking-wider text-[#908fa0] font-semibold mb-3">Analytics</p>
                <h2 className="text-xl font-bold text-[#e4dfff] mb-4">Daily Summary</h2>
                <div className="space-y-2 text-sm">
                  {dailySummary.length === 0 && <p className="text-[#908fa0]">No daily data yet.</p>}
                  {dailySummary.map((row) => (
                    <div
                      key={row._id}
                      className="rounded-xl bg-[rgba(52,49,80,0.4)] border border-[rgba(70,69,84,0.3)] p-3"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-[#e4dfff]">{row._id}</p>
                        <p className="font-bold text-amber-300">{formatCurrency(row.revenue)}</p>
                      </div>
                      <div className="flex items-center justify-between text-xs text-[#908fa0]">
                        <span>{row.sessions} sessions</span>
                        <span>Avg: {formatDuration(row.avgDurationMs)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}
          </div>

          {/* Right: Live Activity Feed */}
          <div className="lg:col-span-3">
            <GlassCard className="h-full">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-[0.65rem] uppercase tracking-wider text-[#908fa0] font-semibold">Real-time</p>
                  <h2 className="mt-1 text-xl font-bold text-[#e4dfff]">Live Activity Feed</h2>
                </div>
                <span className="chip chip-emerald">
                  <span className="live-dot" />
                  Live
                </span>
              </div>

              <div className="max-h-[520px] space-y-2.5 overflow-auto pr-1">
                {orders.length === 0 && (
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <div className="h-16 w-16 rounded-2xl bg-[rgba(52,49,80,0.5)] flex items-center justify-center mb-4">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="#908fa0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <p className="text-[#c7c4d7] font-medium">Waiting for live events...</p>
                    <p className="text-sm text-[#908fa0] mt-1">Order activity will appear here in real-time</p>
                  </div>
                )}
                {orders.map((order, idx) => (
                  <div
                    key={`${order.sessionId || "session"}-${idx}`}
                    className="rounded-xl bg-[rgba(52,49,80,0.4)] border border-[rgba(70,69,84,0.3)] px-4 py-3 animate-slide-up"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-semibold text-[#e4dfff] truncate">{order.itemName}</p>
                        <p className="mt-0.5 text-xs text-[#908fa0]">Added by <span className="text-[#c7c4d7]">{order.addedByName || "Unknown"}</span></p>
                      </div>
                      <p className="text-base font-bold text-amber-300 shrink-0">{formatCurrency(order.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>

      {/* Modify Menu Modal */}
      {showModifyMenuModal && (
        <div className="modal-backdrop">
          <div className="modal-panel max-w-2xl">
            {menuStep === menuSteps.HOME && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-bold text-[#e4dfff]">Modify Menu</h2>
                  <button id="owner-close-modify-menu-btn" className="btn-ghost text-xs px-3 py-1.5" onClick={closeModifyMenu}>Close</button>
                </div>
                <p className="text-sm text-[#c7c4d7] mb-4">Choose what you want to update.</p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <button
                    id="owner-add-category-option"
                    className="rounded-2xl border border-[rgba(70,69,84,0.3)] bg-[rgba(52,49,80,0.5)] p-5 text-left hover:bg-[rgba(52,49,80,0.8)] hover:border-indigo-500/30 transition-all"
                    onClick={() => setMenuStep(menuSteps.CATEGORY)}
                  >
                    <div className="h-10 w-10 rounded-xl bg-indigo-500/20 flex items-center justify-center mb-3">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M4 6h16M4 12h16M4 18h7" stroke="#c0c1ff" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <p className="font-semibold text-[#e4dfff]">Add Category</p>
                    <p className="mt-1 text-xs text-[#908fa0]">Create a new category block.</p>
                  </button>
                  <button
                    id="owner-add-item-option"
                    className="rounded-2xl border border-[rgba(70,69,84,0.3)] bg-[rgba(52,49,80,0.5)] p-5 text-left hover:bg-[rgba(52,49,80,0.8)] hover:border-indigo-500/30 transition-all"
                    onClick={() => setMenuStep(menuSteps.ITEM)}
                  >
                    <div className="h-10 w-10 rounded-xl bg-cyan-500/20 flex items-center justify-center mb-3">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M12 5v14M5 12h14" stroke="#4cd7f6" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <p className="font-semibold text-[#e4dfff]">Add Menu Item</p>
                    <p className="mt-1 text-xs text-[#908fa0]">Add item with category and price.</p>
                  </button>
                  <button
                    id="owner-upload-menu-option"
                    className="rounded-2xl border border-[rgba(70,69,84,0.3)] bg-[rgba(52,49,80,0.5)] p-5 text-left hover:bg-[rgba(52,49,80,0.8)] hover:border-indigo-500/30 transition-all"
                    onClick={() => setMenuStep(menuSteps.UPLOAD)}
                  >
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-3">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <p className="font-semibold text-[#e4dfff]">Upload Menu File</p>
                    <p className="mt-1 text-xs text-[#908fa0]">Bulk import from CSV/TXT.</p>
                  </button>
                </div>
              </div>
            )}

            {menuStep === menuSteps.CATEGORY && (
              <form onSubmit={createCategory} className="space-y-4">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-bold text-[#e4dfff]">Add Category</h2>
                </div>
                <div>
                  <label className="block text-xs text-[#c7c4d7] mb-1.5 font-medium">Category Name</label>
                  <input
                    id="owner-category-name-input"
                    className="input-nocturne"
                    placeholder="e.g. Spirits, Cocktails, Beer"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    required
                  />
                </div>
                <button id="owner-save-category-btn" className="btn-primary" type="submit">Save Category</button>
              </form>
            )}

            {menuStep === menuSteps.ITEM && (
              <form onSubmit={createMenuItem} className="space-y-4">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-bold text-[#e4dfff]">Add Menu Item</h2>
                </div>
                <div>
                  <label className="block text-xs text-[#c7c4d7] mb-1.5 font-medium">Category</label>
                  <select
                    id="owner-item-category-select"
                    className="select-nocturne"
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value)}
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category.name}>{category.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#c7c4d7] mb-1.5 font-medium">Item Name</label>
                  <input
                    id="owner-item-name-input"
                    className="input-nocturne"
                    placeholder="Enter item name"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#c7c4d7] mb-1.5 font-medium">Price (Rs)</label>
                  <input
                    id="owner-item-price-input"
                    className="input-nocturne"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </div>
                <button id="owner-save-item-btn" className="btn-primary" type="submit">Save Item</button>
              </form>
            )}

            {menuStep === menuSteps.UPLOAD && (
              <form onSubmit={uploadMenuFile} className="space-y-4">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-bold text-[#e4dfff]">Upload Menu File</h2>
                </div>
                <div className="rounded-xl border border-dashed border-[rgba(99,102,241,0.3)] bg-indigo-500/5 p-6 text-center">
                  <p className="text-sm text-[#c7c4d7] mb-2">Format: <code className="text-[#c0c1ff] bg-indigo-500/20 px-1.5 py-0.5 rounded text-xs">category,itemName,price</code></p>
                  <input
                    id="owner-menu-file-input"
                    className="input-nocturne mt-3"
                    type="file"
                    accept=".txt,.csv"
                    onChange={(e) => setMenuFile(e.target.files?.[0] || null)}
                  />
                </div>
                <button id="owner-upload-file-btn" className="btn-primary" type="submit">Upload File</button>
              </form>
            )}

            {menuStatus && (
              <p className="mt-3 text-sm text-emerald-400">{menuStatus}</p>
            )}

            <div className="mt-5 flex justify-end gap-3">
              <button id="owner-menu-back-btn" className="btn-ghost text-xs" onClick={() => setMenuStep(menuSteps.HOME)}>Back</button>
              <button id="owner-menu-close-btn" className="btn-ghost text-xs" onClick={closeModifyMenu}>Close</button>
              <button
                id="owner-menu-done-btn"
                className="btn-primary text-xs"
                onClick={async () => {
                  await loadMenuData();
                  closeModifyMenu();
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Menu Modal */}
      {showViewMenuModal && (
        <div className="modal-backdrop">
          <div className="modal-panel max-w-3xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-[#e4dfff]">Club Menu</h2>
              <button id="owner-close-view-menu-btn" className="btn-ghost text-xs px-3 py-1.5" onClick={() => setShowViewMenuModal(false)}>Close</button>
            </div>

            <div className="max-h-[65vh] space-y-3 overflow-auto pr-1">
              {Object.keys(groupedMenu).length === 0 && (
                <p className="text-sm text-[#908fa0] text-center py-8">No menu items yet.</p>
              )}
              {Object.entries(groupedMenu).map(([category, items]) => (
                <div key={category} className="rounded-2xl bg-[rgba(52,49,80,0.4)] border border-[rgba(70,69,84,0.3)] p-4">
                  <h3 className="text-sm font-bold text-[#c0c1ff] uppercase tracking-wider mb-3">{category}</h3>
                  <div className="space-y-1.5">
                    {items.map((item) => (
                      <div key={item._id} className="flex items-center justify-between py-1.5 border-b border-[rgba(70,69,84,0.2)] last:border-0 text-sm">
                        <span className="text-[#c7c4d7]">{item.itemName}</span>
                        <span className="font-bold text-amber-300">{formatCurrency(item.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Staff Modal */}
      {showStaffModal && (
        <div className="modal-backdrop">
          <div className="modal-panel max-w-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-[#e4dfff]">Add Staff</h2>
              <button
                id="owner-close-staff-modal-btn"
                className="btn-ghost text-xs px-3 py-1.5"
                onClick={() => { setShowStaffModal(false); setStaffStatus(""); }}
              >
                Close
              </button>
            </div>

            <form onSubmit={createStaff} className="space-y-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-xs text-[#c7c4d7] mb-1.5 font-medium">Full Name</label>
                  <input
                    id="owner-staff-name-input"
                    className="input-nocturne"
                    placeholder="Staff name"
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#c7c4d7] mb-1.5 font-medium">Email</label>
                  <input
                    id="owner-staff-email-input"
                    className="input-nocturne"
                    type="email"
                    placeholder="staff@example.com"
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-xs text-[#c7c4d7] mb-1.5 font-medium">Password</label>
                  <input
                    id="owner-staff-password-input"
                    className="input-nocturne"
                    type="password"
                    placeholder="••••••••"
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#c7c4d7] mb-1.5 font-medium">Role</label>
                  <select
                    id="owner-staff-role-select"
                    className="select-nocturne"
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value)}
                  >
                    <option value="bartender">Bartender</option>
                    <option value="entry">Entry</option>
                    <option value="exit">Exit</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                {staffStatus ? (
                  <p className="text-sm text-emerald-400">{staffStatus}</p>
                ) : <span />}
                <button id="owner-create-staff-btn" className="btn-primary" type="submit">Create Staff</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
