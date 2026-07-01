const FormField = ({ label, children }) => (
  <label className="block">
    <span className="mb-2 block text-sm font-medium text-slate-300">{label}</span>
    {children}
  </label>
);

export const inputClass = "w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-red-500";
export const selectClass = inputClass;
export const textareaClass = `${inputClass} min-h-28 resize-y`;

export default FormField;
