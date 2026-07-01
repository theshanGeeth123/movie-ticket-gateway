const styles = {
  active: "bg-emerald-500/15 text-emerald-300 border-emerald-400/20",
  confirmed: "bg-emerald-500/15 text-emerald-300 border-emerald-400/20",
  paid: "bg-emerald-500/15 text-emerald-300 border-emerald-400/20",
  scheduled: "bg-blue-500/15 text-blue-300 border-blue-400/20",
  processing: "bg-blue-500/15 text-blue-300 border-blue-400/20",
  pending_payment: "bg-amber-500/15 text-amber-300 border-amber-400/20",
  unpaid: "bg-amber-500/15 text-amber-300 border-amber-400/20",
  reserved: "bg-amber-500/15 text-amber-300 border-amber-400/20",
  used: "bg-purple-500/15 text-purple-300 border-purple-400/20",
  cancelled: "bg-red-500/15 text-red-300 border-red-400/20",
  failed: "bg-red-500/15 text-red-300 border-red-400/20",
  expired: "bg-slate-500/15 text-slate-300 border-slate-400/20",
  inactive: "bg-slate-500/15 text-slate-300 border-slate-400/20",
  booked: "bg-red-500/15 text-red-300 border-red-400/20",
  blocked: "bg-slate-500/15 text-slate-300 border-slate-400/20",
  available: "bg-emerald-500/15 text-emerald-300 border-emerald-400/20",
};

const StatusBadge = ({ value }) => {
  const key = String(value ?? "unknown").toLowerCase();
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[key] || "bg-slate-800 text-slate-300 border-white/10"}`}>
      {String(value ?? "unknown").replaceAll("_", " ")}
    </span>
  );
};

export default StatusBadge;
