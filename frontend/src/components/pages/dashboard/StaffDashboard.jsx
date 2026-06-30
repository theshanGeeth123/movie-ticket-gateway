import { LogOut } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

const StaffDashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-white/[0.04] p-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-widest text-emerald-400">
              Staff Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-bold">
              Welcome, {user?.name || "Staff"}
            </h1>
            <p className="mt-2 text-slate-400">{user?.email}</p>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 font-medium hover:bg-red-700"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>

        <div className="mt-8 rounded-2xl bg-slate-900 p-6">
          Staff dashboard API connection will be added later.
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;