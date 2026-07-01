import { Link } from "react-router-dom";
import { CalendarDays, ShieldCheck, Sparkles, Ticket } from "lucide-react";
import MoviesPage from "./MoviesPage";

const HomePage = () => (
  <>
    <section className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_20%_10%,rgba(220,38,38,.45),transparent_35%),linear-gradient(135deg,#020617,#111827_55%,#000)]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_.9fr] lg:px-8 lg:py-24">
        <div>
          <div className="mb-6 inline-flex rounded-full border border-red-400/20 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200"><Sparkles className="mr-2 h-4 w-4" /> Real-time movie ticket platform</div>
          <h1 className="text-5xl font-black leading-tight text-white md:text-7xl">Book your cinema seat in seconds.</h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-300">Browse movies, select showtimes, reserve seats, pay with the demo Stripe flow, and download your digital ticket with QR verification.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/movies" className="rounded-2xl bg-red-600 px-6 py-3 font-bold text-white hover:bg-red-700"><Ticket className="mr-2 inline h-5 w-5" />Book tickets</Link>
            <Link to="/register" className="rounded-2xl border border-white/10 px-6 py-3 font-bold text-white hover:bg-white/5">Create account</Link>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {[[ShieldCheck,"Verified tickets","Digital tickets can be checked by staff."],[CalendarDays,"Live showtimes","See seat availability before booking."],[Ticket,"Instant PDF","Download and email tickets after payment."]].map(([Icon,title,text])=><div key={title} className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl"><Icon className="mb-4 h-8 w-8 text-red-300"/><h3 className="font-black text-white">{title}</h3><p className="mt-2 text-sm text-slate-400">{text}</p></div>)}
        </div>
      </div>
    </section>
    <MoviesPage embedded />
  </>
);
export default HomePage;
