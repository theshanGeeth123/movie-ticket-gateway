import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import AuthLayout from "../../layouts/AuthLayout";
import FormField, { inputClass } from "../../components/ui/FormField";
import { getErrorMessage } from "../../utils/formatters";

const ResetPasswordPage = () => {
  const [params]=useSearchParams(); const navigate=useNavigate();
  const emailFromUrl=useMemo(()=>params.get("email")||"",[params]); const otpFromUrl=useMemo(()=>params.get("otp")||"",[params]);
  const [form,setForm]=useState({email:emailFromUrl, otp:otpFromUrl, password:"", confirmPassword:""}); const [loading,setLoading]=useState(false); const [error,setError]=useState("");
  const submit=async(e)=>{e.preventDefault(); setError(""); if(form.password!==form.confirmPassword)return setError("Passwords do not match"); setLoading(true); try{const {data}=await api.post("/auth/reset-password",{email:form.email,otp:form.otp,password:form.password}); toast.success(data?.message||"Password reset successful"); navigate("/login",{replace:true});}catch(err){setError(getErrorMessage(err,"Reset failed"));}finally{setLoading(false);}};
  return <AuthLayout title="Create new password" subtitle="Use your verified reset OTP to create a new password.">{error&&<div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}<form onSubmit={submit} className="space-y-5"><FormField label="Email"><input type="email" className={inputClass} required value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})}/></FormField><FormField label="OTP"><input className={inputClass} required value={form.otp} onChange={(e)=>setForm({...form,otp:e.target.value})}/></FormField><FormField label="New password"><input type="password" minLength={6} className={inputClass} required value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})}/></FormField><FormField label="Confirm password"><input type="password" minLength={6} className={inputClass} required value={form.confirmPassword} onChange={(e)=>setForm({...form,confirmPassword:e.target.value})}/></FormField><button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 font-bold hover:bg-red-700 disabled:opacity-60">{loading&&<Loader2 className="h-5 w-5 animate-spin"/>}Reset password</button></form><p className="mt-6 text-center text-sm text-slate-400"><Link className="text-red-300" to="/login">Back to login</Link></p></AuthLayout>;
};
export default ResetPasswordPage;
