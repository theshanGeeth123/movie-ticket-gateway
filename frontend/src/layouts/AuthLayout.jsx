import { Film } from "lucide-react";

const AuthLayout = ({ title, subtitle, children }) => (
  <div className="min-h-screen bg-slate-950 text-white">
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden bg-[radial-gradient(circle_at_20%_20%,rgba(220,38,38,.55),transparent_35%),linear-gradient(135deg,#7f1d1d,#020617_55%,#000)] p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10"><Film className="h-7 w-7" /></div>
          <div><h1 className="text-2xl font-black">Movie Ticket Gateway</h1><p className="text-sm text-white/60">Real-time cinema booking platform</p></div>
        </div>
        <div>
          <h2 className="max-w-xl text-5xl font-black leading-tight">Book seats, process payments, and generate digital tickets instantly.</h2>
          <p className="mt-6 max-w-lg text-lg text-white/65">A professional MERN movie ticket system with role-based dashboards for admins, staff, and customers.</p>
        </div>
        <p className="text-sm text-white/45">Secure auth · OTP verification · Stripe demo payments · Cloudinary posters</p>
      </div>
      <div className="flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600"><Film className="h-7 w-7" /></div>
            <h1 className="text-3xl font-black">Movie Ticket Gateway</h1>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl">
            <div className="mb-7">
              <h2 className="text-3xl font-black">{title}</h2>
              {subtitle && <p className="mt-2 text-sm text-slate-400">{subtitle}</p>}
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default AuthLayout;
