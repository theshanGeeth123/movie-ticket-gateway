import { Link, NavLink, Outlet } from "react-router-dom";
import { Film, LayoutDashboard, LogOut, Ticket } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const PublicLayout = () => {
  const { user, isAuthenticated, logout, roleHome } = useAuth();
  const active = ({ isActive }) => isActive ? "text-white" : "text-slate-400 hover:text-white";
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-600"><Film className="h-6 w-6" /></div>
            <div><p className="text-lg font-black">Movie Gateway</p><p className="text-xs text-slate-500">Cinema tickets</p></div>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-semibold md:flex">
            <NavLink to="/movies" className={active}>Movies</NavLink>
            {isAuthenticated && user?.role === "customer" && <NavLink to="/customer/tickets" className={active}>My Tickets</NavLink>}
          </nav>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Link to={roleHome()} className="hidden rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/5 sm:inline-flex"><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard</Link>
                <button onClick={logout} className="rounded-2xl bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"><LogOut className="inline h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Logout</span></button>
              </>
            ) : (
              <>
                <Link to="/login" className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/5">Login</Link>
                <Link to="/register" className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-700"><Ticket className="mr-2 inline h-4 w-4" />Register</Link>
              </>
            )}
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
};

export default PublicLayout;
