"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import type {
  User,
  LoginPayload,
  RegisterPayload,
  OtpPayload,
  UserRole,
} from "@/types";

const ROLE_DASHBOARD: Record<UserRole, string> = {
  USER: "/driver/dashboard",
  OPERATOR: "/manager/dashboard",
  ADMIN: "/admin/dashboard",
};

const getErrorMessage = (err: unknown, defaultMsg: string) => {
  if (err && typeof err === "object" && "response" in err) {
    const axiosErr = err as any;
    if (axiosErr.response?.data?.message) return axiosErr.response.data.message;
  }
  if (err instanceof Error) {
    // Axios hataları için "Request failed with status code 404" mesajını ez
    if (err.message.includes("status code")) return defaultMsg;
    return err.message;
  }
  return defaultMsg;
};

export function useAuth() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Login ────────────────────────────────────────────────────────
  const login = useCallback(
    async (payload: LoginPayload) => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await authApi.login(payload);
        if (!data.success || !data.data) throw new Error(data.message);

        const { accessToken, refreshToken, user } = data.data;
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("user", JSON.stringify(user));

        router.push(ROLE_DASHBOARD[user.role]);
      } catch (err: unknown) {
        setError(getErrorMessage(err, "Giriş yapılamadı."));
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  // ── Register ─────────────────────────────────────────────────────
  const register = useCallback(async (payload: RegisterPayload) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await authApi.register(payload);
      if (!data.success || !data.data) throw new Error(data.message);

      // verificationCode: test ortamında backend logdan okunur, burada da gösterilir
      const verificationCode = (data.data as { verificationCode?: string }).verificationCode;
      return { success: true, gsm: payload.gsm, verificationCode };
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Kayıt yapılamadı."));
      return { success: false, gsm: "", verificationCode: undefined };
    } finally {
      setLoading(false);
    }
  }, []);

  // ── OTP Verify (For Register) ────────────────────────────────────
  const verifyOtp = useCallback(
    async (payload: OtpPayload) => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await authApi.verifyOtp(payload);
        if (!data.success || !data.data) throw new Error(data.message);

        const { accessToken, refreshToken, user } = data.data;
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("user", JSON.stringify(user));

        router.push(ROLE_DASHBOARD[user.role]);
      } catch (err: unknown) {
        setError(getErrorMessage(err, "OTP doğrulanamadı."));
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  // ── OTP Login Request (For Şoför Login Step 1) ───────────────────
  const requestLoginOtp = useCallback(async (gsm: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await authApi.requestLoginOtp({ gsm });
      if (!data.success) throw new Error(data.message);
      const verificationCode = (data.data as { verificationCode?: string })?.verificationCode;
      return { success: true, verificationCode };
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Giriş kodu gönderilemedi. Numarasınız kayıtlı olmayabilir."));
      return { success: false, verificationCode: undefined };
    } finally {
      setLoading(false);
    }
  }, []);

  // ── OTP Login Verify (For Şoför Login Step 2) ────────────────────
  const verifyLoginOtp = useCallback(
    async (payload: OtpPayload) => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await authApi.verifyLoginOtp(payload);
        if (!data.success || !data.data) throw new Error(data.message);

        const { accessToken, refreshToken, user } = data.data;
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("user", JSON.stringify(user));

        router.push(ROLE_DASHBOARD[user.role]);
      } catch (err: unknown) {
        setError(getErrorMessage(err, "Giriş şifresi (OTP) doğrulanamadı."));
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  // ── Logout ───────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem("refreshToken") || "";
    try {
      await authApi.logout(refreshToken);
    } finally {
      localStorage.clear();
      router.push("/");
    }
  }, [router]);

  // ── Get current user ─────────────────────────────────────────────
  const getCurrentUser = useCallback((): User | null => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }, []);

  return {
    login,
    register,
    verifyOtp,
    requestLoginOtp,
    verifyLoginOtp,
    logout,
    getCurrentUser,
    loading,
    error,
    setError,
  };
}
