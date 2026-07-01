import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Mail } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import AuthLayout from "../../layouts/AuthLayout";
import FormField, { inputClass } from "../../components/ui/FormField";
import { getErrorMessage } from "../../utils/formatters";

const ForgotPasswordPage = () => {
  const [email,setEmail]=useState(""); const [loading,setLoading]=useState(false); const [error,setError]=useState(""); const navigate=useNavigate();
  const submit=async(e)=>{e.preventDefault(); setError(""); setLoading(true); try{const {data}=await api.post("/auth/forgot-password",{email}); toast.success(data?.message||"OTP sent"); navigate(`/verify-reset-otp?email=${encodeURIComponent(email)}`);}catch(err){setError(getErrorMessage(err,"Failed to send OTP"));}finally{setLoading(false);}};
  return <AuthLayout title="Reset password" subtitle="We will email you an OTP to verify password reset.">
    {error&&<div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}
    <form onSubmit={submit} className="space-y-5"><FormField label="Email address"><div className="relative"><Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500"/><input type="email" className={`${inputClass} pl-12`} required value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@gmail.com"/></div></FormField><button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 font-bold hover:bg-red-700 disabled:opacity-60">{loading&&<Loader2 className="h-5 w-5 animate-spin"/>}Send reset OTP</button></form>
    <p className="mt-6 text-center text-sm text-slate-400"><Link className="text-red-300" to="/login">Back to login</Link></p>
  </AuthLayout>;
};
export default ForgotPasswordPage;
