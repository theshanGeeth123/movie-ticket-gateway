import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, RefreshCcw } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import AuthLayout from "../../layouts/AuthLayout";
import FormField, { inputClass } from "../../components/ui/FormField";
import { getErrorMessage } from "../../utils/formatters";

const VerifyEmailPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const initialEmail = useMemo(() => params.get("email") || "", [params]);
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");

  const verify = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const { data } = await api.post("/auth/verify-email", { email, otp });
      toast.success(data?.message || "Email verified");
      navigate("/login", { replace: true });
    } catch (err) { setError(getErrorMessage(err, "Verification failed")); }
    finally { setLoading(false); }
  };
  const resend = async () => {
    if (!email) return setError("Email is required");
    setError(""); setResending(true);
    try { const { data } = await api.post("/auth/resend-verification-otp", { email }); toast.success(data?.message || "OTP sent"); }
    catch (err) { setError(getErrorMessage(err, "Failed to resend OTP")); }
    finally { setResending(false); }
  };
  return <AuthLayout title="Verify email" subtitle="Enter the six-digit OTP sent to your email address.">
    {error && <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}
    <form onSubmit={verify} className="space-y-5">
      <FormField label="Email"><input type="email" className={inputClass} required value={email} onChange={(e)=>setEmail(e.target.value)} /></FormField>
      <FormField label="OTP code"><input className={`${inputClass} text-center text-xl tracking-[0.5em]`} maxLength={6} required value={otp} onChange={(e)=>setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" /></FormField>
      <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 font-bold hover:bg-red-700 disabled:opacity-60">{loading && <Loader2 className="h-5 w-5 animate-spin"/>}Verify email</button>
    </form>
    <button disabled={resending} onClick={resend} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 px-5 py-3 font-bold hover:bg-white/5 disabled:opacity-60">{resending ? <Loader2 className="h-5 w-5 animate-spin"/> : <RefreshCcw className="h-5 w-5"/>}Resend OTP</button>
    <p className="mt-6 text-center text-sm text-slate-400"><Link className="text-red-300" to="/login">Back to login</Link></p>
  </AuthLayout>;
};
export default VerifyEmailPage;
