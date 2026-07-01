const Pagination = ({ page = 1, pages = 1, onPageChange }) => {
  if (!pages || pages <= 1) return null;
  return (
    <div className="mt-5 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
      <span>Page {page} of {pages}</span>
      <div className="flex gap-2">
        <button className="rounded-xl border border-white/10 px-3 py-2 disabled:opacity-40" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Previous</button>
        <button className="rounded-xl border border-white/10 px-3 py-2 disabled:opacity-40" disabled={page >= pages} onClick={() => onPageChange(page + 1)}>Next</button>
      </div>
    </div>
  );
};

export default Pagination;
