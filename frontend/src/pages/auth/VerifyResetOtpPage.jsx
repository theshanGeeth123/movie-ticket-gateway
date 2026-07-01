import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import AuthLayout from "../../layouts/AuthLayout";
import FormField, { inputClass } from "../../components/ui/FormField";
import { getErrorMessage } from "../../utils/formatters";

const VerifyResetOtpPage = () => {
  const [params]=useSearchParams(); const navigate=useNavigate(); const initialEmail=useMemo(()=>params.get("email")||"",[params]);
  const [email,setEmail]=useState(initialEmail); const [otp,setOtp]=useState(""); const [loading,setLoading]=useState(false); const [error,setError]=useState("");
  const submit=async(e)=>{e.preventDefault(); setError(""); setLoading(true); try{const {data}=await api.post("/auth/verify-reset-otp",{email,otp}); toast.success(data?.message||"OTP verified"); navigate(`/reset-password?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`);}catch(err){setError(getErrorMessage(err,"OTP verification failed"));}finally{setLoading(false);}};
  return <AuthLayout title="Verify reset OTP" subtitle="Enter the OTP before creating your new password.">{error&&<div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}<form onSubmit={submit} className="space-y-5"><FormField label="Email"><input type="email" className={inputClass} value={email} onChange={(e)=>setEmail(e.target.value)} required/></FormField><FormField label="OTP"><input className={`${inputClass} text-center text-xl tracking-[0.5em]`} value={otp} onChange={(e)=>setOtp(e.target.value.replace(/\D/g,"").slice(0,6))} maxLength={6} required/></FormField><button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 font-bold hover:bg-red-700 disabled:opacity-60">{loading&&<Loader2 className="h-5 w-5 animate-spin"/>}Verify OTP</button></form></AuthLayout>;
};
export default VerifyResetOtpPage;
