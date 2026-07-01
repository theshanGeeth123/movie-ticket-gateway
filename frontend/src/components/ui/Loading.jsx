import { Loader2 } from "lucide-react";

const Loading = ({ label = "Loading..." }) => (
  <div className="flex min-h-[240px] items-center justify-center text-slate-300">
    <div className="text-center">
      <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin" />
      <p className="text-sm">{label}</p>
    </div>
  </div>
);

export default Loading;
