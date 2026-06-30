import { createContext, useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";

const AuthContext = createContext(null);

const SESSION_FLAG_KEY = "movie_ticket_has_session";

const extractUser = (data) => {
  return data?.user || data?.data?.user || data?.loggedInUser || null;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const isAuthenticated = Boolean(user);

  const fetchMe = async () => {
    try {
      const { data } = await api.get("/auth/me");
      const currentUser = extractUser(data);

      setUser(currentUser);

      if (currentUser) {
        localStorage.setItem(SESSION_FLAG_KEY, "true");
      }

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
    const { data } = await api.post("/auth/login", {
      email,
      password,
    });

    const loggedUser = extractUser(data);

    if (loggedUser) {
      setUser(loggedUser);
      localStorage.setItem(SESSION_FLAG_KEY, "true");
    } else {
      await fetchMe();
    }

    toast.success(data?.message || "Login successful");

    return data;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // clear frontend even if backend logout fails
    } finally {
      setUser(null);
      localStorage.removeItem(SESSION_FLAG_KEY);
      toast.success("Logged out successfully");
    }
  };

  useEffect(() => {
    const hasSession = localStorage.getItem(SESSION_FLAG_KEY);

    if (hasSession) {
      fetchMe();
    } else {
      setAuthLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      setUser,
      authLoading,
      isAuthenticated,
      login,
      logout,
      fetchMe,
    }),
    [user, authLoading, isAuthenticated]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};