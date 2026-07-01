const PageHeader = ({ title, subtitle, action }) => (
  <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
    <div>
      <h1 className="text-3xl font-black text-white md:text-4xl">{title}</h1>
      {subtitle && <p className="mt-2 text-sm text-slate-400">{subtitle}</p>}
    </div>
    {action}
  </div>
);
export default PageHeader;
