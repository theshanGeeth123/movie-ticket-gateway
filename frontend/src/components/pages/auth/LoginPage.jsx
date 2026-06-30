import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Film, Loader2, Lock, Mail } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

const getDashboardPath = (role) => {
  if (role === "admin") return "/admin/dashboard";
  if (role === "staff") return "/staff/dashboard";
  return "/customer/dashboard";
};

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, fetchMe } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    setFormData((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(formData);
      const currentUser = await fetchMe();

      navigate(getDashboardPath(currentUser?.role), {
        replace: true,
      });
    } catch (err) {
      const message =
        err?.response?.data?.message || "Login failed. Please try again.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="grid min-h-screen lg:grid-cols-2">
        <div className="hidden bg-gradient-to-br from-red-700 via-slate-950 to-black p-12 lg:flex lg:flex-col lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
              <Film className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Movie Ticket Gateway</h1>
              <p className="text-sm text-white/70">Real-time booking system</p>
            </div>
          </div>

          <div>
            <h2 className="max-w-xl text-5xl font-black leading-tight">
              Book seats, pay securely, and download your movie ticket.
            </h2>
            <p className="mt-6 max-w-lg text-lg text-white/70">
              MERN stack online movie ticket booking and real-time payment
              processing gateway.
            </p>
          </div>

          <p className="text-sm text-white/50">
            Admin • Staff • Customer dashboard support
          </p>
        </div>

        <div className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600">
                <Film className="h-7 w-7" />
              </div>
              <h1 className="text-3xl font-bold">Movie Ticket Gateway</h1>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl">
              <div className="mb-8">
                <h2 className="text-3xl font-bold">Welcome back</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Login to continue to your dashboard.
                </p>
              </div>

              {error && (
                <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="admin@gmail.com"
                      className="w-full rounded-2xl border border-white/10 bg-slate-900 px-12 py-3 text-white outline-none transition focus:border-red-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      placeholder="Enter your password"
                      className="w-full rounded-2xl border border-white/10 bg-slate-900 px-12 py-3 text-white outline-none transition focus:border-red-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading && <Loader2 className="h-5 w-5 animate-spin" />}
                  {loading ? "Logging in..." : "Login"}
                </button>
              </form>

              <div className="mt-6 flex items-center justify-between text-sm">
                <Link to="/forgot-password" className="text-red-400 hover:text-red-300">
                  Forgot password?
                </Link>

                <Link to="/register" className="text-slate-300 hover:text-white">
                  Create account
                </Link>
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-slate-500">
              Use your seeded admin account to test first.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;