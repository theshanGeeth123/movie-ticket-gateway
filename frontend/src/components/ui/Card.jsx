const Card = ({ title, value, icon: Icon, subtitle, children }) => (
  <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-xl">
    <div className="flex items-start justify-between gap-4">
      <div>
        {title && <p className="text-sm text-slate-400">{title}</p>}
        {value !== undefined && <h3 className="mt-2 text-3xl font-black text-white">{value}</h3>}
        {subtitle && <p className="mt-2 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {Icon && <div className="rounded-2xl bg-red-500/10 p-3 text-red-300"><Icon className="h-6 w-6" /></div>}
    </div>
    {children}
  </div>
);

export default Card;
