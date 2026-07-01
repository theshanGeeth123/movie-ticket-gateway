import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Loader2, Lock, Mail } from "lucide-react";
import AuthLayout from "../../layouts/AuthLayout";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage, roleHome } from "../../utils/formatters";
import FormField, { inputClass } from "../../components/ui/FormField";
import GoogleLoginButton from "../../components/ui/GoogleLoginButton";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const redirectUser = (user) => {
    const target = location.state?.from?.pathname || roleHome(user?.role);
    navigate(target, { replace: true });
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const user = await login(form);
      redirectUser(user);
    } catch (err) {
      setError(getErrorMessage(err, "Login failed"));
    } finally { setLoading(false); }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Login to manage bookings, tickets, and cinema operations.">
      {error && <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}
      <form onSubmit={submit} className="space-y-5">
        <FormField label="Email address"><div className="relative"><Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" /><input className={`${inputClass} pl-12`} type="email" required value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} placeholder="admin@gmail.com" /></div></FormField>
        <FormField label="Password"><div className="relative"><Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" /><input className={`${inputClass} pl-12`} type="password" required value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})} placeholder="Enter password" /></div></FormField>
        <div className="flex justify-end"><Link className="text-sm text-red-300 hover:text-red-200" to="/forgot-password">Forgot password?</Link></div>
        <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 font-bold hover:bg-red-700 disabled:opacity-60">{loading && <Loader2 className="h-5 w-5 animate-spin" />} Login</button>
      </form>
      <div className="my-6 flex items-center gap-3"><div className="h-px flex-1 bg-white/10" /><span className="text-xs text-slate-500">OR</span><div className="h-px flex-1 bg-white/10" /></div>
      <GoogleLoginButton onSuccess={redirectUser} />
      <p className="mt-6 text-center text-sm text-slate-400">New customer? <Link className="text-red-300 hover:text-red-200" to="/register">Create account</Link></p>
    </AuthLayout>
  );
};
export default LoginPage;
