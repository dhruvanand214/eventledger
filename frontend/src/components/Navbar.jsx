import { NavLink, useNavigate } from "react-router-dom";
import { getRole, logout } from "../utils/auth";

export default function Navbar() {
  const role = getRole();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-40 border-b border-[rgba(70,69,84,0.3)] bg-[rgba(18,15,44,0.8)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 3h10v2H3V3zm0 4h10v2H3V7zm0 4h7v2H3v-2z" fill="white" />
            </svg>
          </div>
          <span className="text-base font-bold gradient-text tracking-tight">EventLedger</span>
        </div>

        {/* Nav items + Logout */}
        <div className="flex items-center gap-2 text-sm">
          {role === "admin" && <NavItem to="/admin" label="Admin" />}
          {role === "owner" && <NavItem to="/owner" label="Dashboard" />}
          {role === "bartender" && <NavItem to="/bartender" label="Orders" />}
          {role === "exit" && <NavItem to="/exit" label="Exit" />}
          {role === "entry" && <NavItem to="/entry" label="Entry" />}

          <button
            onClick={handleLogout}
            id="navbar-logout-btn"
            className="btn-ghost text-xs px-3 py-1.5"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

function NavItem({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
          isActive
            ? "bg-indigo-500/20 border border-indigo-500/30 text-indigo-300"
            : "text-[#c7c4d7] hover:text-[#e4dfff] hover:bg-white/5"
        }`
      }
    >
      {label}
    </NavLink>
  );
}
