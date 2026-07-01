import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Film, Loader2, MailCheck, RefreshCcw } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../../api/axios";

const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const emailFromUrl = useMemo(() => {
    return searchParams.get("email") || "";
  }, [searchParams]);

  const [email, setEmail] = useState(emailFromUrl);
  const [otp, setOtp] = useState("");

  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async (event) => {
    event.preventDefault();
    setError("");

    if (!email || !otp) {
      setError("Email and OTP are required");
      return;
    }

    setVerifyLoading(true);

    try {
      const { data } = await api.post("/auth/verify-email", {
        email,
        otp,
      });

      toast.success(data?.message || "Email verified successfully");

      navigate("/login", {
        replace: true,
      });
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        "Email verification failed. Please try again.";

      setError(message);
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");

    if (!email) {
      setError("Please enter your email before resending OTP");
      return;
    }

    setResendLoading(true);

    try {
      const { data } = await api.post("/auth/resend-verification-otp", {
        email,
      });

      toast.success(data?.message || "Verification OTP resent successfully");
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        "Failed to resend verification OTP. Please try again.";

      setError(message);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600">
              <Film className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold">Verify your email</h1>
            <p className="mt-2 text-sm text-slate-400">
              Enter the OTP sent to your email address.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl">
            {error && (
              <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleVerify} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  placeholder="customer@gmail.com"
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-red-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  OTP code
                </label>
                <div className="relative">
                  <MailCheck className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={otp}
                    onChange={(event) => setOtp(event.target.value)}
                    required
                    maxLength={6}
                    placeholder="Enter OTP"
                    className="w-full rounded-2xl border border-white/10 bg-slate-900 px-12 py-3 text-white outline-none transition focus:border-red-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={verifyLoading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {verifyLoading && <Loader2 className="h-5 w-5 animate-spin" />}
                {verifyLoading ? "Verifying..." : "Verify email"}
              </button>
            </form>

            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendLoading}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {resendLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <RefreshCcw className="h-5 w-5" />
              )}
              {resendLoading ? "Resending..." : "Resend OTP"}
            </button>

            <p className="mt-6 text-center text-sm text-slate-400">
              Already verified?{" "}
              <Link to="/login" className="text-red-400 hover:text-red-300">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;