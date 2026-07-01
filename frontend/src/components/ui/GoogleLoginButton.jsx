import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

const GoogleLoginButton = ({ onSuccess }) => {
  const ref = useRef(null);
  const { googleLogin } = useAuth();
  const [ready, setReady] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) return;
    const existing = document.querySelector("script[data-google-identity]");
    const init = () => {
      if (!window.google || !ref.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }) => {
          try {
            const user = await googleLogin(credential);
            onSuccess?.(user);
          } catch (error) {
            toast.error(error?.response?.data?.message || "Google login failed");
          }
        },
      });
      window.google.accounts.id.renderButton(ref.current, { theme: "filled_black", size: "large", width: 380, text: "continue_with" });
      setReady(true);
    };
    if (existing) { init(); return; }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentity = "true";
    script.onload = init;
    document.body.appendChild(script);
  }, [clientId]);

  if (!clientId) return <p className="text-center text-xs text-slate-500">Add VITE_GOOGLE_CLIENT_ID to enable Google login.</p>;
  return <div className="flex justify-center"><div ref={ref}>{!ready && <div className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-400">Loading Google login...</div>}</div></div>;
};

export default GoogleLoginButton;
