import { NavLink, useNavigate } from "react-router-dom";
import { getRole, logout } from "../utils/auth";

export default function Navbar(){

  const role = getRole();
  const navigate = useNavigate();

  const handleLogout = ()=>{
    logout();
    navigate("/");
  }

  return(

    <div className="sticky top-0 z-40 border-b border-white/20 bg-slate-900/35 p-4 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
        <h1 className="text-xl font-bold tracking-wide text-white">
          EventLedger
        </h1>

        <div className="flex items-center gap-2 text-sm text-white md:gap-3">
          {role === "admin" && <NavItem to="/admin" label="Admin" />}
          {role === "owner" && <NavItem to="/owner" label="Dashboard" />}
          {role === "bartender" && <NavItem to="/bartender" label="Orders" />}
          {role === "exit" && <NavItem to="/exit" label="Exit" />}
          {role === "entry" && <NavItem to="/entry" label="Entry" />}

          <button
            onClick={handleLogout}
            className="rounded-lg border border-white/30 bg-white/10 px-3 py-1.5 hover:bg-white/20"
          >
            Logout
          </button>
        </div>
      </div>
    </div>

  )
}

function NavItem({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `rounded-lg px-3 py-1.5 transition-colors ${
          isActive ? "bg-cyan-500 text-white" : "bg-white/10 text-white hover:bg-white/20"
        }`
      }
    >
      {label}
    </NavLink>
  );
}
