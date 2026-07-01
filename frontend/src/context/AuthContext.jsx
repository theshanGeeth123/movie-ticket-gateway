import { createContext, useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { roleHome } from "../utils/formatters";

const AuthContext = createContext(null);
const SESSION_FLAG_KEY = "movie_ticket_has_session";

const extractUser = (data) => data?.user || data?.data?.user || data?.loggedInUser || null;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const { data } = await api.get("/auth/me");
      const currentUser = extractUser(data);
      setUser(currentUser);
      if (currentUser) localStorage.setItem(SESSION_FLAG_KEY, "true");
      return currentUser;
    } catch {
      setUser(null);
      localStorage.removeItem(SESSION_FLAG_KEY);
      return null;
    } finally {
      setAuthLoading(false);
    }
  };

  const login = async ({ email, password }) => {
    const { data } = await api.post("/auth/login", { email, password });
    const loggedUser = extractUser(data);
    if (loggedUser) {
      setUser(loggedUser);
      localStorage.setItem(SESSION_FLAG_KEY, "true");
    } else {
      await fetchMe();
    }
    toast.success(data?.message || "Login successful");
    return loggedUser || data?.user;
  };

  const googleLogin = async (credential) => {
    const { data } = await api.post("/auth/google-login", { credential });
    const loggedUser = extractUser(data);
    if (loggedUser) {
      setUser(loggedUser);
      localStorage.setItem(SESSION_FLAG_KEY, "true");
    } else {
      await fetchMe();
    }
    toast.success(data?.message || "Google login successful");
    return loggedUser || data?.user;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // frontend session is cleared anyway
    } finally {
      setUser(null);
      localStorage.removeItem(SESSION_FLAG_KEY);
      toast.success("Logged out successfully");
    }
  };

  useEffect(() => {
    if (localStorage.getItem(SESSION_FLAG_KEY)) fetchMe();
    else setAuthLoading(false);
  }, []);

  const value = useMemo(() => ({
    user,
    setUser,
    authLoading,
    isAuthenticated: Boolean(user),
    login,
    googleLogin,
    logout,
    fetchMe,
    roleHome: () => roleHome(user?.role),
  }), [user, authLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};
