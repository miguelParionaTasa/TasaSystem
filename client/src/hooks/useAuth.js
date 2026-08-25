import { useEffect } from "react";
import axiosInstance from "../axios";
import { clearUserProfile, storeUserProfile } from "../services/api";

const useAuth = (setAuthenticated, setUser, setLoading) => {
  useEffect(() => {
    let active = true;
    const markExpired = () => {
      clearUserProfile();
      if (active) {
        setAuthenticated(false);
        setUser(null);
      }
    };
    const verify = async () => {
      try {
        const { data } = await axiosInstance.get("/auth/me");
        storeUserProfile(data.user);
        if (active) {
          setUser(data.user);
          setAuthenticated(true);
        }
      } catch {
        markExpired();
      } finally {
        if (active) setLoading(false);
      }
    };
    window.addEventListener("tasa:session-expired", markExpired);
    void verify();
    return () => {
      active = false;
      window.removeEventListener("tasa:session-expired", markExpired);
    };
  }, [setAuthenticated, setLoading, setUser]);
};

export default useAuth;
