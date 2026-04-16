"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MaterialIcon from "@/components/ui/MaterialIcon";
import { useAuth } from "@/hooks/useAuth";
import { reservationApi, paymentApi } from "@/lib/api";
import type { User, ReservationResponse } from "@/types";

// ─── Types ───────────────────────────────────────────────────────────────────

type PaymentStep = "form" | "processing" | "success" | "error";

interface PaycellResult {
  transactionId: string;
  amount: number;
  status: string;
}

// ─── Paycell Payment Content (uses useSearchParams) ──────────────────────────

function PaycellPaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getCurrentUser } = useAuth();

  const [user, setUser] = useState<User | null>(null);
  const [reservation, setReservation] = useState<ReservationResponse | null>(null);
  const [msisdn, setMsisdn] = useState("");
  const [step, setStep] = useState<PaymentStep>("form");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PaycellResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [agreedTerms, setAgreedTerms] = useState(false);

  const reservationId = searchParams.get("reservationId");

  // ── Load user & reservation ────────────────────────────────────────────
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.replace("/login?role=driver");
      return;
    }
    setUser(currentUser);
    setMsisdn(currentUser.gsm || "");
  }, [getCurrentUser, router]);

  useEffect(() => {
    if (!reservationId) {
      setError("Rezervasyon ID bulunamadı.");
      setLoading(false);
      return;
    }

    const fetchReservation = async () => {
      try {
        const { data } = await reservationApi.getReservation(Number(reservationId));
        if (data?.success && data.data) {
          setReservation(data.data);
        } else {
          setError("Rezervasyon bilgisi alınamadı.");
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || "Rezervasyon yüklenirken hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    fetchReservation();
  }, [reservationId]);

  // ── Handle Payment ─────────────────────────────────────────────────────
  const handlePayment = useCallback(async () => {
    if (!reservation || !msisdn) return;

    setStep("processing");
    setError(null);

    try {
      const { data } = await paymentApi.initiatePaycell(reservation.id, msisdn);

      if (data?.success && data.data) {
        setResult({
          transactionId: data.data.transactionId || "N/A",
          amount: data.data.amount,
          status: data.data.status,
        });
        setStep("success");
      } else {
        setError(data?.message || "Ödeme başarısız oldu.");
        setStep("error");
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || "Ödeme işlemi sırasında hata oluştu.";
      setError(msg);
      setStep("error");
    }
  }, [reservation, msisdn]);

  // ── Loading State ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center portal-gradient">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-on-surface-variant font-medium">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="min-h-screen flex items-center justify-center portal-gradient">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md text-center">
          <MaterialIcon name="error_outline" className="text-6xl text-error mb-4" />
          <h2 className="text-xl font-bold text-on-surface mb-2">Hata</h2>
          <p className="text-on-surface-variant mb-6">{error || "Rezervasyon bulunamadı."}</p>
          <button
            onClick={() => router.push("/driver/dashboard")}
            className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary-container transition-colors"
          >
            Panele Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-grow portal-gradient pt-20 pb-12">
        <div className="max-w-xl mx-auto px-4">
          {/* Paycell Branding Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#FFD100] to-[#FFA000] rounded-3xl shadow-xl shadow-yellow-500/20 mb-4">
              <MaterialIcon name="smartphone" className="text-4xl text-white" />
            </div>
            <h1 className="text-2xl font-extrabold font-headline text-on-surface">
              Paycell Mobil Ödeme
            </h1>
            <p className="text-on-surface-variant text-sm mt-1">
              Turkcell faturanıza / bakiyenize yansıtılır
            </p>
          </div>

          {/* Payment Card */}
          <div className="bg-white rounded-3xl shadow-2xl border border-outline-variant/20 overflow-hidden">
            {/* Reservation Summary */}
            <div className="bg-gradient-to-r from-primary-container to-primary p-6 text-white">
              <div className="flex items-center gap-3 mb-4">
                <MaterialIcon name="receipt_long" className="text-2xl text-white/70" />
                <div>
                  <p className="text-white/60 text-xs font-bold uppercase tracking-widest">
                    Rezervasyon #{reservation.id}
                  </p>
                  <p className="text-sm font-medium text-white/80">
                    {new Date(reservation.startTime).toLocaleString("tr-TR")} →{" "}
                    {new Date(reservation.endTime).toLocaleString("tr-TR")}
                  </p>
                </div>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-white/60 text-xs uppercase font-bold">Süre</p>
                  <p className="text-lg font-bold">{reservation.durationHours} Saat</p>
                </div>
                <div className="text-right">
                  <p className="text-white/60 text-xs uppercase font-bold">Toplam Tutar</p>
                  <p className="text-3xl font-black">₺{reservation.totalPrice.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Step Content */}
            <div className="p-6">
              {step === "form" && (
                <div className="space-y-6">
                  {/* Phone Number Input */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-on-surface-variant tracking-widest px-1">
                      TURKCELL GSM NUMARANIZ
                    </label>
                    <div className="relative group">
                      <MaterialIcon
                        name="phone_android"
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors"
                      />
                      <input
                        type="tel"
                        value={msisdn}
                        onChange={(e) => setMsisdn(e.target.value)}
                        placeholder="5XXXXXXXXX"
                        maxLength={11}
                        className="w-full pl-12 pr-4 py-4 bg-surface border border-outline-variant/30 rounded-2xl outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-bold text-on-surface font-mono tracking-widest text-lg"
                      />
                    </div>
                    <p className="text-xs text-on-surface-variant px-1">
                      Ödeme tutarı Turkcell hattınıza yansıtılacaktır.
                    </p>
                  </div>

                  {/* Payment Method Info */}
                  <div className="bg-surface rounded-2xl p-4 border border-outline-variant/20">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#FFD100] to-[#FFA000] rounded-xl flex items-center justify-center shrink-0">
                        <MaterialIcon name="verified" className="text-white text-xl" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-on-surface">Direct Carrier Billing</p>
                        <p className="text-xs text-on-surface-variant mt-1">
                          Kredi kartı gerekmez. Ödeme tutarı doğrudan Turkcell faturanıza veya
                          kontör bakiyenize yansıtılır.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Simülasyon bilgisi */}
                  <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                    <div className="flex items-start gap-3">
                      <MaterialIcon name="info" className="text-blue-500 text-xl shrink-0 mt-0.5" />
                      <div className="text-xs text-blue-700 space-y-1">
                        <p className="font-bold">Simülasyon Kuralları:</p>
                        <ul className="list-disc list-inside space-y-0.5">
                          <li>Tutar ≤ ₺1000 → Ödeme başarılı ✓</li>
                          <li>Tutar &gt; ₺1000 → Limit yetersiz ✗</li>
                          <li>Numara "00" ile bitiyorsa → Hat kapalı ✗</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Terms */}
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreedTerms}
                      onChange={(e) => setAgreedTerms(e.target.checked)}
                      className="mt-1 w-5 h-5 accent-primary rounded"
                    />
                    <span className="text-xs text-on-surface-variant leading-relaxed">
                      Paycell Mobil Ödeme koşullarını kabul ediyorum. Ödeme tutarı olan{" "}
                      <strong className="text-on-surface">₺{reservation.totalPrice.toFixed(2)}</strong>{" "}
                      Turkcell hattıma yansıtılacaktır.
                    </span>
                  </label>

                  {error && (
                    <div className="bg-error-container text-on-error-container p-4 rounded-2xl text-sm font-semibold flex items-center gap-3">
                      <MaterialIcon name="warning" />
                      {error}
                    </div>
                  )}

                  {/* Pay Button */}
                  <button
                    onClick={handlePayment}
                    disabled={!msisdn || msisdn.length < 10 || !agreedTerms}
                    className="w-full bg-gradient-to-r from-[#FFD100] to-[#FFA000] text-gray-900 py-5 rounded-3xl font-black text-lg shadow-xl shadow-yellow-500/20 hover:shadow-yellow-500/40 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  >
                    <MaterialIcon name="payment" className="text-2xl" />
                    Paycell ile Öde — ₺{reservation.totalPrice.toFixed(2)}
                  </button>

                  <button
                    onClick={() => router.push("/driver/dashboard")}
                    className="w-full text-on-surface-variant hover:text-error text-sm font-semibold py-3 transition-colors"
                  >
                    İptal Et ve Geri Dön
                  </button>
                </div>
              )}

              {step === "processing" && (
                <div className="py-16 flex flex-col items-center gap-6 text-center">
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-primary/20 rounded-full" />
                    <div className="absolute inset-0 w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <MaterialIcon
                      name="smartphone"
                      className="absolute inset-0 flex items-center justify-center text-3xl text-primary w-20 h-20"
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-on-surface">Ödeme İşleniyor...</h3>
                    <p className="text-on-surface-variant text-sm mt-2">
                      Paycell sistemiyle iletişim kuruluyor.
                      <br />
                      Lütfen bekleyiniz.
                    </p>
                  </div>
                  <div className="flex gap-2 mt-4">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-3 h-3 bg-primary rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {step === "success" && result && (
                <div className="py-12 flex flex-col items-center gap-6 text-center">
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                    <MaterialIcon name="check_circle" className="text-6xl text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-on-surface">Ödeme Başarılı! 🎉</h3>
                    <p className="text-on-surface-variant text-sm mt-2">
                      Paycell mobil ödemeniz başarıyla tamamlandı.
                    </p>
                  </div>

                  <div className="w-full bg-surface rounded-2xl p-5 space-y-3 text-left border border-outline-variant/20">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-on-surface-variant uppercase font-bold">İşlem No</span>
                      <span className="font-mono text-sm font-bold text-on-surface">
                        {result.transactionId}
                      </span>
                    </div>
                    <div className="h-px bg-outline-variant/20" />
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-on-surface-variant uppercase font-bold">Tutar</span>
                      <span className="text-lg font-black text-green-600">
                        ₺{result.amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="h-px bg-outline-variant/20" />
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-on-surface-variant uppercase font-bold">Durum</span>
                      <span className="text-sm font-bold text-green-600 flex items-center gap-1">
                        <MaterialIcon name="verified" className="text-sm" />
                        Tamamlandı
                      </span>
                    </div>
                    <div className="h-px bg-outline-variant/20" />
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-on-surface-variant uppercase font-bold">
                        Ödeme Yöntemi
                      </span>
                      <span className="text-sm font-bold text-on-surface">Paycell DCB</span>
                    </div>
                  </div>

                  <button
                    onClick={() => router.push("/driver/dashboard")}
                    className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-primary-container transition-colors flex items-center justify-center gap-2"
                  >
                    <MaterialIcon name="dashboard" />
                    Panele Dön
                  </button>
                </div>
              )}

              {step === "error" && (
                <div className="py-12 flex flex-col items-center gap-6 text-center">
                  <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
                    <MaterialIcon name="cancel" className="text-6xl text-error" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-on-surface">Ödeme Başarısız</h3>
                    <p className="text-on-surface-variant text-sm mt-2 max-w-sm">
                      {error || "Ödeme işlemi sırasında bir hata oluştu."}
                    </p>
                  </div>

                  <div className="flex gap-3 w-full">
                    <button
                      onClick={() => {
                        setStep("form");
                        setError(null);
                      }}
                      className="flex-1 bg-primary text-white py-4 rounded-2xl font-bold hover:bg-primary-container transition-colors flex items-center justify-center gap-2"
                    >
                      <MaterialIcon name="refresh" />
                      Tekrar Dene
                    </button>
                    <button
                      onClick={() => router.push("/driver/dashboard")}
                      className="flex-1 bg-surface border border-outline-variant/30 text-on-surface py-4 rounded-2xl font-bold hover:bg-surface-container transition-colors"
                    >
                      Geri Dön
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Security badge */}
          <div className="flex items-center justify-center gap-2 mt-6 text-on-surface-variant">
            <MaterialIcon name="lock" className="text-sm" />
            <p className="text-xs">256-bit SSL ile güvenli ödeme</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

// ─── Main Page (Suspense boundary for useSearchParams) ───────────────────────

export default function PaycellPaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center portal-gradient">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PaycellPaymentContent />
    </Suspense>
  );
}
