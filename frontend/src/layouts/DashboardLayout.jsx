import { NavLink, Outlet, Link } from "react-router-dom";
import { BarChart3, CalendarDays, Clapperboard, Film, Home, LogOut, Menu, ScanLine, Settings, Ticket, Users, Warehouse, X, CreditCard, UserCircle } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const adminLinks = [
  ["/admin/dashboard", "Overview", Home],
  ["/admin/movies", "Movies", Film],
  ["/admin/halls", "Halls", Warehouse],
  ["/admin/showtimes", "Showtimes", CalendarDays],
  ["/admin/bookings", "Bookings", CreditCard],
  ["/admin/tickets", "Tickets", Ticket],
  ["/admin/users", "Users", Users],
  ["/admin/reports", "Reports", BarChart3],
];

const staffLinks = [
  ["/staff/dashboard", "Overview", Home],
  ["/staff/showtimes", "Today's shows", CalendarDays],
  ["/staff/verify", "Verify ticket", ScanLine],
  ["/staff/tickets", "Tickets", Ticket],
  ["/staff/bookings", "Bookings", CreditCard],
];

const customerLinks = [
  ["/customer/dashboard", "Overview", Home],
  ["/movies", "Browse movies", Clapperboard],
  ["/customer/bookings", "My bookings", CreditCard],
  ["/customer/tickets", "My tickets", Ticket],
];

const getLinks = (role) => role === "admin" ? adminLinks : role === "staff" ? staffLinks : customerLinks;

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const links = getLinks(user?.role);

  const sidebar = (
    <aside className="flex h-full w-72 flex-col border-r border-white/10 bg-slate-950 p-4">
      <div className="mb-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-600"><Film className="h-6 w-6" /></div>
          <div><p className="font-black text-white">Movie Gateway</p><p className="text-xs capitalize text-slate-500">{user?.role} panel</p></div>
        </Link>
        <button className="lg:hidden" onClick={() => setOpen(false)}><X className="h-6 w-6" /></button>
      </div>
      <nav className="space-y-2">
        {links.map(([to, label, Icon]) => (
          <NavLink key={to} to={to} onClick={() => setOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${isActive ? "bg-red-600 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>
            <Icon className="h-5 w-5" /> {label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto rounded-3xl border border-white/10 bg-white/[0.04] p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10"><UserCircle className="h-6 w-6" /></div>
          <div className="min-w-0"><p className="truncate text-sm font-bold text-white">{user?.name}</p><p className="truncate text-xs text-slate-500">{user?.email}</p></div>
        </div>
        <button onClick={logout} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-white/5"><LogOut className="h-4 w-4" />Logout</button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="lg:hidden flex items-center justify-between border-b border-white/10 p-4">
        <button onClick={() => setOpen(true)} className="rounded-xl border border-white/10 p-2"><Menu className="h-6 w-6" /></button>
        <Link to="/" className="font-black">Movie Gateway</Link>
        <Settings className="h-5 w-5 text-slate-500" />
      </div>
      {open && <div className="fixed inset-0 z-50 bg-black/60 lg:hidden"><div className="h-full">{sidebar}</div></div>}
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <div className="hidden lg:block">{sidebar}</div>
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
