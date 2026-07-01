import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Lock, Mail, User } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import AuthLayout from "../../layouts/AuthLayout";
import FormField, { inputClass } from "../../components/ui/FormField";
import { getErrorMessage } from "../../utils/formatters";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:"", email:"", password:"", confirmPassword:"" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e) => {
    e.preventDefault(); setError("");
    if (form.password !== form.confirmPassword) return setError("Passwords do not match");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", { name: form.name, email: form.email, password: form.password });
      toast.success(data?.message || "Registration successful");
      navigate(`/verify-email?email=${encodeURIComponent(form.email)}`, { replace: true });
    } catch (err) { setError(getErrorMessage(err, "Registration failed")); }
    finally { setLoading(false); }
  };
  return <AuthLayout title="Create account" subtitle="Register as a customer and verify your email using OTP.">
    {error && <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}
    <form onSubmit={submit} className="space-y-5">
      <FormField label="Full name"><div className="relative"><User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500"/><input className={`${inputClass} pl-12`} required value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} placeholder="Your name" /></div></FormField>
      <FormField label="Email"><div className="relative"><Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500"/><input type="email" className={`${inputClass} pl-12`} required value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} placeholder="you@gmail.com" /></div></FormField>
      <FormField label="Password"><div className="relative"><Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500"/><input type="password" minLength={6} className={`${inputClass} pl-12`} required value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})} placeholder="Minimum 6 characters" /></div></FormField>
      <FormField label="Confirm password"><input type="password" minLength={6} className={inputClass} required value={form.confirmPassword} onChange={(e)=>setForm({...form,confirmPassword:e.target.value})} placeholder="Re-enter password" /></FormField>
      <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 font-bold hover:bg-red-700 disabled:opacity-60">{loading && <Loader2 className="h-5 w-5 animate-spin"/>}Create account</button>
    </form>
    <p className="mt-6 text-center text-sm text-slate-400">Already have an account? <Link className="text-red-300" to="/login">Login</Link></p>
  </AuthLayout>;
};
export default RegisterPage;
