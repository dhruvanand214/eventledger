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
    <div className="w-full">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <div className="rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-xl">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-cyan-100/80">Control Center</p>
              <h1 className="mt-2 text-3xl font-semibold text-white md:text-4xl">Owner Dashboard</h1>
              <p className="mt-3 text-sm text-cyan-50/80">
                {ownerContext.clubName} ({ownerContext.clubId})
                {ownerContext.eventName !== "-" && ownerContext.eventName ? ` • ${ownerContext.eventName}` : ""}
              </p>
              <div className="mt-4 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/85">
                Mode: {ownerContext.serviceType === "one_time" ? "One-time Event" : "Full-time Club"}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
              <button className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-medium text-white" onClick={openModifyMenu}>
                Modify Menu
              </button>
              <button
                className="rounded-xl bg-slate-100/20 px-4 py-2 text-sm font-medium text-white"
                onClick={() => setShowViewMenuModal(true)}
              >
                View Menu
              </button>
              {canManageStaff && (
                <button
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white"
                  onClick={() => setShowStaffModal(true)}
                >
                  Add Staff
                </button>
              )}
              {ownerContext.serviceType === "one_time" && ownerContext.eventActive && (
                <button className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white" onClick={closeEvent}>
                  End Event
                </button>
              )}
              <button
                className="rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium text-white"
                onClick={() => {
                  logout();
                  window.location.href = "/";
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/20 bg-emerald-500/25 p-5 text-white backdrop-blur-lg">
            <p className="text-sm text-emerald-50/80">Revenue</p>
            <p className="mt-2 text-3xl font-semibold">{formatCurrency(revenue)}</p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-sky-500/25 p-5 text-white backdrop-blur-lg">
            <p className="text-sm text-sky-50/80">Active Sessions</p>
            <p className="mt-2 text-3xl font-semibold">{sessions}</p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-amber-500/25 p-5 text-white backdrop-blur-lg">
            <p className="text-sm text-amber-50/80">Live Orders</p>
            <p className="mt-2 text-3xl font-semibold">{orders.length}</p>
          </div>
        </div>

        {eventActionStatus && (
          <div className="rounded-xl border border-emerald-200/30 bg-emerald-500/20 px-4 py-3 text-sm text-emerald-100">
            {eventActionStatus}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-2">
            {ownerContext.serviceType === "one_time" && !ownerContext.eventActive && (
              <GlassCard>
                <h2 className="text-xl font-semibold text-white">Start New Event</h2>
                <p className="mt-1 text-sm text-white/75">Your last event is closed. Start a new event to continue operations.</p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <input
                    className="w-full rounded-lg border border-white/20 bg-white/90 px-3 py-2 text-slate-800 outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Enter new event name"
                    value={newEventName}
                    onChange={(e) => setNewEventName(e.target.value)}
                  />
                  <button
                    className="rounded-lg bg-cyan-500 px-4 py-2 text-white"
                    onClick={() => bindEvent(newEventName)}
                  >
                    Start Event
                  </button>
                </div>
              </GlassCard>
            )}

            {ownerContext.serviceType === "one_time" && ownerContext.eventActive && (
              <GlassCard>
                <h2 className="text-xl font-semibold text-white">Active Event</h2>
                <p className="mt-2 text-sm text-white/80">{ownerContext.eventName || "Unnamed Event"}</p>
                <p className="mt-1 text-xs text-white/65">Event ID: {ownerContext.eventId || "-"}</p>
              </GlassCard>
            )}

            {ownerContext.serviceType === "one_time" && !ownerContext.eventActive && (
              <GlassCard>
                <h2 className="text-xl font-semibold text-white">Past Events Summary</h2>
                <div className="mt-4 space-y-3">
                  {eventHistory.length === 0 && <p className="text-sm text-white/75">No past events found.</p>}
                  {eventHistory.map((row) => (
                    <div key={`${row._id.eventId}-${row.lastExitTime}`} className="rounded-lg border border-white/15 bg-white/5 p-3 text-white">
                      <p className="font-medium">{row._id.eventName}</p>
                      <p className="text-xs text-white/60">{row._id.eventId}</p>
                      <div className="mt-2 flex justify-between text-sm text-white/85">
                        <span>Sessions: {row.sessions}</span>
                        <span>{formatCurrency(row.revenue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {ownerContext.serviceType === "full_time" && (
              <GlassCard>
                <h2 className="text-xl font-semibold text-white">Daily Summary (Last 30 Days)</h2>
                <div className="mt-4 space-y-2 text-sm text-white">
                  {dailySummary.length === 0 && <p className="text-white/75">No daily data yet.</p>}
                  {dailySummary.map((row) => (
                    <div key={row._id} className="grid grid-cols-4 gap-2 rounded-lg border border-white/15 bg-white/5 p-3">
                      <p>{row._id}</p>
                      <p>{row.sessions} sessions</p>
                      <p>{formatCurrency(row.revenue)}</p>
                      <p>{formatDuration(row.avgDurationMs)}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}
          </div>

          <div className="lg:col-span-3">
            <GlassCard>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Live Activity Feed</h2>
                <span className="rounded-full border border-cyan-300/40 bg-cyan-400/20 px-3 py-1 text-xs text-cyan-100">
                  Real-time
                </span>
              </div>
              <div className="mt-4 max-h-[520px] space-y-3 overflow-auto pr-1">
                {orders.length === 0 && <p className="text-sm text-white/75">Waiting for live order events...</p>}
                {orders.map((order, idx) => (
                  <div key={`${order.sessionId || "session"}-${idx}`} className="rounded-xl border border-white/15 bg-white/5 p-4 text-white">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-base font-medium">{order.itemName}</p>
                        <p className="mt-1 text-xs text-white/65">Added by {order.addedByName || "Unknown"}</p>
                      </div>
                      <p className="text-base font-semibold text-amber-200">{formatCurrency(order.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>

      {showModifyMenuModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-white/20 bg-slate-900/70 p-6 text-white backdrop-blur-2xl">
            {menuStep === menuSteps.HOME && (
              <div>
                <h2 className="text-2xl font-semibold">Modify Menu</h2>
                <p className="mt-1 text-sm text-white/70">Choose what you want to update.</p>
                <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <button className="rounded-xl border border-white/20 bg-white/10 p-4 text-left" onClick={() => setMenuStep(menuSteps.CATEGORY)}>
                    <p className="font-medium">Add Category</p>
                    <p className="mt-1 text-xs text-white/70">Create a new category block.</p>
                  </button>
                  <button className="rounded-xl border border-white/20 bg-white/10 p-4 text-left" onClick={() => setMenuStep(menuSteps.ITEM)}>
                    <p className="font-medium">Add Menu Item</p>
                    <p className="mt-1 text-xs text-white/70">Add item with category and price.</p>
                  </button>
                  <button className="rounded-xl border border-white/20 bg-white/10 p-4 text-left" onClick={() => setMenuStep(menuSteps.UPLOAD)}>
                    <p className="font-medium">Upload Menu File</p>
                    <p className="mt-1 text-xs text-white/70">Bulk import from csv/txt.</p>
                  </button>
                </div>
              </div>
            )}

            {menuStep === menuSteps.CATEGORY && (
              <form onSubmit={createCategory} className="space-y-3">
                <h2 className="text-xl font-semibold">Add Category</h2>
                <input
                  className="w-full rounded-lg bg-white/90 p-2 text-slate-800"
                  placeholder="Category name"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  required
                />
                <button className="rounded-lg bg-cyan-500 px-4 py-2" type="submit">Save Category</button>
              </form>
            )}

            {menuStep === menuSteps.ITEM && (
              <form onSubmit={createMenuItem} className="space-y-3">
                <h2 className="text-xl font-semibold">Add Menu Item</h2>
                <select
                  className="w-full rounded-lg bg-white/90 p-2 text-slate-800"
                  value={itemCategory}
                  onChange={(e) => setItemCategory(e.target.value)}
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category.name}>{category.name}</option>
                  ))}
                </select>
                <input
                  className="w-full rounded-lg bg-white/90 p-2 text-slate-800"
                  placeholder="Item name"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  required
                />
                <input
                  className="w-full rounded-lg bg-white/90 p-2 text-slate-800"
                  type="number"
                  min="0"
                  placeholder="Price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
                <button className="rounded-lg bg-cyan-500 px-4 py-2" type="submit">Save Item</button>
              </form>
            )}

            {menuStep === menuSteps.UPLOAD && (
              <form onSubmit={uploadMenuFile} className="space-y-3">
                <h2 className="text-xl font-semibold">Upload Menu File</h2>
                <p className="text-sm text-white/75">Format: category,itemName,price</p>
                <input
                  className="w-full rounded-lg border border-white/20 bg-white/90 p-2 text-slate-800"
                  type="file"
                  accept=".txt,.csv"
                  onChange={(e) => setMenuFile(e.target.files?.[0] || null)}
                />
                <button className="rounded-lg bg-cyan-500 px-4 py-2" type="submit">Upload File</button>
              </form>
            )}

            <p className="mt-3 min-h-5 text-sm text-emerald-300">{menuStatus}</p>

            <div className="mt-5 flex justify-end gap-3">
              <button className="rounded-lg bg-white/15 px-4 py-2" onClick={() => setMenuStep(menuSteps.HOME)}>
                Back
              </button>
              <button className="rounded-lg bg-white/15 px-4 py-2" onClick={closeModifyMenu}>
                Close
              </button>
              <button
                className="rounded-lg bg-cyan-500 px-4 py-2"
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

      {showViewMenuModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-white/20 bg-slate-900/70 p-6 text-white backdrop-blur-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Club Menu</h2>
              <button className="rounded-lg bg-white/15 px-3 py-1" onClick={() => setShowViewMenuModal(false)}>
                Close
              </button>
            </div>

            <div className="max-h-[68vh] space-y-4 overflow-auto pr-1">
              {Object.keys(groupedMenu).length === 0 && <p className="text-sm text-white/75">No menu items yet.</p>}
              {Object.entries(groupedMenu).map(([category, items]) => (
                <div key={category} className="rounded-xl border border-white/20 bg-white/5 p-4">
                  <h3 className="text-lg font-semibold text-cyan-100">{category}</h3>
                  <div className="mt-2 divide-y divide-white/10">
                    {items.map((item) => (
                      <div key={item._id} className="flex items-center justify-between py-2 text-sm">
                        <span>{item.itemName}</span>
                        <span className="font-medium text-amber-200">{formatCurrency(item.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-white">Add Staff</h2>
              <button
                className="text-sm text-white/80 hover:text-white"
                onClick={() => {
                  setShowStaffModal(false);
                  setStaffStatus("");
                }}
              >
                Close
              </button>
            </div>

            <form onSubmit={createStaff} className="space-y-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <input
                  className="w-full rounded-lg bg-white/90 p-2"
                  placeholder="Staff name"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  required
                />
                <input
                  className="w-full rounded-lg bg-white/90 p-2"
                  type="email"
                  placeholder="Staff email"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <input
                  className="w-full rounded-lg bg-white/90 p-2"
                  type="password"
                  placeholder="Password"
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  required
                />
                <select className="w-full rounded-lg bg-white/90 p-2" value={staffRole} onChange={(e) => setStaffRole(e.target.value)}>
                  <option value="bartender">Bartender</option>
                  <option value="entry">Entry</option>
                  <option value="exit">Exit</option>
                </select>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <p className="min-h-5 text-sm text-emerald-300">{staffStatus}</p>
                <button className="rounded-lg bg-cyan-500 px-4 py-2 text-white" type="submit">
                  Create Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
