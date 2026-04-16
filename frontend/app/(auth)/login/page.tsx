"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import MaterialIcon from "@/components/ui/MaterialIcon";

const ROLE_META: Record<string, { label: string; icon: string; color: string }> = {
  driver: { label: "Şoför", icon: "directions_car", color: "text-on-primary-container" },
  manager: { label: "Otopark Yöneticisi", icon: "apartment", color: "text-on-secondary-fixed-variant" },
  admin: { label: "Sistem Admini", icon: "admin_panel_settings", color: "text-outline-variant" },
};

function LoginForm() {
  const params = useSearchParams();
  const role = params.get("role") || "driver";
  const roleMeta = ROLE_META[role] || ROLE_META.driver;

  const { login, requestLoginOtp, verifyLoginOtp, loading, error, setError } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gsm, setGsm] = useState("");
  const [otp, setOtp] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [devOtpCode, setDevOtpCode] = useState<string | undefined>(undefined);

  useEffect(() => {
    setError(null);
  }, [email, password, gsm, otp, setError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (role === "driver") {
      // GSM FLOW
      const cleanGsm = gsm.replace(/\D/g, "");
      if (!otpSent) {
        const result = await requestLoginOtp(cleanGsm);
        if (result && result.success) {
          setDevOtpCode(result.verificationCode);
          setOtpSent(true);
        }
      } else {
        await verifyLoginOtp({ gsm: cleanGsm, otp });
      }
    } else {
      // EMAIL/PASSWORD FLOW
      await login({ email, password });
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Card */}
      <div className="bg-white rounded-xl shadow-xl p-8 space-y-6 border border-outline-variant/30">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-primary-container rounded-full flex items-center justify-center mx-auto">
            <MaterialIcon name={roleMeta.icon} className="text-3xl text-white" />
          </div>
          <h1 className="text-3xl font-extrabold font-headline text-primary">
            Giriş Yap
          </h1>
          <p className="text-sm text-on-surface-variant">
            <span className="font-semibold">{roleMeta.label}</span> olarak giriş yapıyorsunuz
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-error-container text-on-error-container text-sm rounded-lg px-4 py-3 flex items-center gap-2">
            <MaterialIcon name="error" className="text-base" />
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {role === "driver" ? (
            <>
              {/* DRIVER: SMS Flow */}
              {!otpSent ? (
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-1.5" htmlFor="gsm">
                    Telefon Numarası
                  </label>
                  <div className="relative">
                    <MaterialIcon name="call" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xl" />
                    <input
                      id="gsm"
                      type="tel"
                      required
                      value={gsm}
                      onChange={(e) => setGsm(e.target.value)}
                      placeholder="05xx xxx xx xx"
                      className="w-full pl-10 pr-4 py-3 border border-outline-variant rounded-lg text-on-surface placeholder-outline focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition text-sm"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-on-surface-variant mb-1">
                    SMS Doğrulama Kodunu Giriniz
                  </p>
                  {/* Test ortamı: gerçek SMS yerine kod ekranda gösteriliyor */}
                  {devOtpCode && (
                    <div className="bg-secondary/10 border border-secondary rounded-lg px-4 py-2 text-center mb-2">
                      <p className="text-xs text-on-surface-variant">📱 Test Ortamı — SMS Kodu:</p>
                      <span className="font-mono font-bold text-2xl tracking-[0.4em] text-primary">{devOtpCode}</span>
                    </div>
                  )}
                  <label className="block text-sm font-medium text-on-surface-variant mb-1.5" htmlFor="otp">
                    SMS Doğrulama Kodu
                  </label>
                  <div className="relative">
                    <MaterialIcon name="key" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xl" />
                    <input
                      id="otp"
                      type="text"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="____"
                      maxLength={6}
                      className="w-full pl-10 pr-4 py-3 border border-outline-variant rounded-lg text-on-surface placeholder-outline focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition text-sm tracking-[0.5em] text-center font-bold"
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={() => { setOtpSent(false); setOtp(""); }}
                    className="text-xs text-primary font-medium hover:underline mt-2 inline-block">
                    Numarayı Değiştir
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              {/* MANAGER / ADMIN: Email Flow */}
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5" htmlFor="email">
                  E-posta
                </label>
                <div className="relative">
                  <MaterialIcon name="mail" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xl" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@email.com"
                    className="w-full pl-10 pr-4 py-3 border border-outline-variant rounded-lg text-on-surface placeholder-outline focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1.5" htmlFor="password">
                  Şifre
                </label>
                <div className="relative">
                  <MaterialIcon name="lock" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xl" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-12 py-3 border border-outline-variant rounded-lg text-on-surface placeholder-outline focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition"
                  >
                    <MaterialIcon name={showPassword ? "visibility_off" : "visibility"} className="text-xl" />
                  </button>
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 mt-4 rounded-xl font-semibold font-headline tracking-wide hover:bg-primary/90 active:scale-95 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                İşleniyor...
              </>
            ) : role === "driver" && !otpSent ? (
              <>
                <MaterialIcon name="sms" className="text-xl" />
                Devam Et (SMS Gönder)
              </>
            ) : (
              <>
                <MaterialIcon name="login" className="text-xl" />
                Giriş Yap
              </>
            )}
          </button>
        </form>

        {/* Footer links */}
        <div className="text-center space-y-2 pt-2 border-t border-outline-variant/20">
          <p className="text-sm text-on-surface-variant">
            Hesabınız yok mu?{" "}
            <Link href={`/register?role=${role}`} className="text-primary font-semibold hover:underline">
              Kayıt Ol
            </Link>
          </p>
          <Link href="/" className="text-xs text-outline hover:text-primary transition-colors flex items-center justify-center gap-1">
            <MaterialIcon name="arrow_back" className="text-sm" />
            Rol seçimine dön
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
