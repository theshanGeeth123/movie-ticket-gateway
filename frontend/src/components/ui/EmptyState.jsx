const EmptyState = ({ title = "No data found", subtitle = "There is nothing to show here yet." }) => (
  <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center">
    <h3 className="text-lg font-bold text-white">{title}</h3>
    <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
  </div>
);

export default EmptyState;
