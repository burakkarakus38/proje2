"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import MaterialIcon from "@/components/ui/MaterialIcon";

type Step = "personal" | "vehicle" | "otp";

const CAR_BRANDS = [
  "Audi", "BMW", "Chevrolet", "Dacia", "Fiat", "Ford", "Honda",
  "Hyundai", "Kia", "Mercedes-Benz", "Opel", "Peugeot", "Renault",
  "Seat", "Skoda", "Toyota", "Volkswagen", "Volvo", "Diğer",
];

const BRAND_MODELS: Record<string, string[]> = {
  "Audi": ["A1", "A3", "A4", "A6", "Q3", "Q5", "Q7"],
  "BMW": ["1 Serisi", "3 Serisi", "5 Serisi", "X1", "X3", "X5"],
  "Dacia": ["Duster", "Logan", "Sandero", "Spring"],
  "Fiat": ["Egea", "Doblo", "Tipo", "500"],
  "Ford": ["Fiesta", "Focus", "Kuga", "Puma", "Transit"],
  "Honda": ["Civic", "CR-V", "HR-V", "Jazz"],
  "Hyundai": ["i10", "i20", "i30", "Tucson", "Santa Fe"],
  "Kia": ["Ceed", "Sportage", "Sorento", "Stinger"],
  "Mercedes-Benz": ["A Serisi", "C Serisi", "E Serisi", "GLC", "GLE"],
  "Opel": ["Astra", "Corsa", "Crossland", "Grandland"],
  "Peugeot": ["208", "308", "3008", "5008"],
  "Renault": ["Clio", "Megane", "Symbol", "Taliant", "Duster"],
  "Seat": ["Ibiza", "Leon", "Ateca", "Arona"],
  "Skoda": ["Fabia", "Octavia", "Kodiaq", "Karoq"],
  "Toyota": ["Corolla", "C-HR", "Yaris", "RAV4", "Hilux"],
  "Volkswagen": ["Polo", "Golf", "Passat", "Tiguan", "T-Roc"],
  "Volvo": ["S60", "S90", "V60", "XC40", "XC60", "XC90"],
  "Chevrolet": ["Spark", "Aveo", "Captiva"],
  "Diğer": ["Diğer"],
};

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
              i < current
                ? "bg-primary text-white"
                : i === current
                ? "bg-primary text-white ring-4 ring-primary/20"
                : "bg-outline-variant/40 text-on-surface-variant"
            }`}
          >
            {i < current ? (
              <MaterialIcon name="check" className="text-sm" />
            ) : (
              i + 1
            )}
          </div>
          {i < total - 1 && (
            <div
              className={`w-8 h-0.5 transition-all duration-300 ${
                i < current ? "bg-primary" : "bg-outline-variant/40"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function RegisterForm() {
  const params = useSearchParams();
  const roleParam = params.get("role") || "driver";

  // Map frontend roles to backend roles
  const roleMap: Record<string, 'USER' | 'OPERATOR' | 'ADMIN'> = {
    driver: 'USER',
    manager: 'OPERATOR',
    admin: 'ADMIN',
  };
  const backendRole = roleMap[roleParam] || 'USER';
  const isDriver = backendRole === 'USER';

  const { register, verifyOtp, loading, error, setError } = useAuth();

  // Conditional step: if driver, then personal -> vehicle -> otp, else personal -> otp
  const totalSteps = isDriver ? 3 : 2;
  const [step, setStep] = useState<Step>("personal");
  const [pendingGsm, setPendingGsm] = useState("");
  const [devOtpCode, setDevOtpCode] = useState<string | undefined>(undefined);

  // Kişisel bilgiler
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [gsm, setGsm] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Araç bilgileri
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [vehicleBrand, setVehicleBrand] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");

  // OTP
  const [otp, setOtp] = useState("");

  useEffect(() => {
    setError(null);
  }, [firstName, lastName, email, gsm, password, vehiclePlate, vehicleBrand, vehicleModel, otp, setError]);

  const handlePersonalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // If driver, go to vehicle step; otherwise go to OTP
    setStep(isDriver ? "vehicle" : "otp");
  };

  const handleVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const result = await register({
      name: fullName,
      email,
      gsm,
      password,
      role: backendRole,
      vehiclePlate: vehiclePlate.trim().toUpperCase(),
      vehicleBrand,
      vehicleModel,
    });
    if (result.success) {
      setPendingGsm(result.gsm);
      setDevOtpCode(result.verificationCode);
      setStep("otp");
    }
  };

  // For non-driver roles, submit directly to register without vehicle
  const handlePersonalSubmitNonDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const result = await register({
      name: fullName,
      email,
      gsm,
      password,
      role: backendRole,
    });
    if (result.success) {
      setPendingGsm(result.gsm);
      setDevOtpCode(result.verificationCode);
      setStep("otp");
    }
  };

  const handleOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    await verifyOtp({ gsm: pendingGsm, otp });
  };

  // ── OTP Step ───────────────────────────────────────────────────────
  if (step === "otp") {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6 border border-outline-variant/30">
          <StepIndicator current={isDriver ? 2 : 1} total={totalSteps} />
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-primary-container rounded-full flex items-center justify-center mx-auto">
              <MaterialIcon name="sms" className="text-3xl text-white" />
            </div>
            <h1 className="text-2xl font-extrabold font-headline text-primary">
              Telefon Doğrulama
            </h1>
            <p className="text-sm text-on-surface-variant">
              <span className="font-semibold">{pendingGsm}</span> numarasına
              gönderilen kodu girin.
            </p>
            {devOtpCode && (
              <div className="bg-secondary/10 border border-secondary rounded-lg px-4 py-3 text-center">
                <p className="text-xs text-on-surface-variant mb-1">📱 Test Ortamı — SMS Kodu:</p>
                <span className="font-mono font-bold text-2xl tracking-[0.4em] text-primary">{devOtpCode}</span>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-error-container text-on-error-container text-sm rounded-lg px-4 py-3 flex items-center gap-2">
              <MaterialIcon name="error" className="text-base" />
              {error}
            </div>
          )}

          <form onSubmit={handleOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1.5" htmlFor="otp">
                OTP Kodu
              </label>
              <input
                id="otp"
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="1 2 3 4"
                className="w-full py-4 px-6 border border-outline-variant rounded-lg text-on-surface text-center text-2xl font-mono tracking-[0.5em] placeholder-outline focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading || otp.length < 4}
              className="w-full bg-primary text-white py-3 rounded-xl font-semibold font-headline tracking-wide hover:bg-primary/90 active:scale-95 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Doğrulanıyor...
                </>
              ) : (
                <>
                  <MaterialIcon name="verified" className="text-xl" />
                  Doğrula & Giriş Yap
                </>
              )}
            </button>
          </form>

          <div className="text-center">
            <button
              onClick={() => { setStep("vehicle"); setOtp(""); setError(null); }}
              className="text-sm text-outline hover:text-primary transition-colors flex items-center justify-center gap-1 mx-auto"
            >
              <MaterialIcon name="arrow_back" className="text-sm" />
              Geri dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Vehicle Step ─────────────────────────────────────────────────── (ONLY FOR DRIVER)
  if (isDriver && step === "vehicle") {
    const availableModels = vehicleBrand ? (BRAND_MODELS[vehicleBrand] || ["Diğer"]) : [];

    return (
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6 border border-outline-variant/30">
          <StepIndicator current={1} total={totalSteps} />
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto">
              <MaterialIcon name="directions_car" className="text-3xl text-on-secondary" />
            </div>
            <h1 className="text-2xl font-extrabold font-headline text-primary">
              Araç Bilgileri
            </h1>
            <p className="text-sm text-on-surface-variant">
              Plaka, marka ve model bilgilerinizi girin.
            </p>
          </div>

          {error && (
            <div className="bg-error-container text-on-error-container text-sm rounded-lg px-4 py-3 flex items-center gap-2">
              <MaterialIcon name="error" className="text-base" />
              {error}
            </div>
          )}

          <form onSubmit={handleVehicleSubmit} className="space-y-4">
            {/* Plaka */}
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1.5" htmlFor="vehiclePlate">
                Plaka <span className="text-error">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <div className="w-1 h-5 bg-primary rounded-full" />
                  <MaterialIcon name="local_offer" className="text-outline text-xl" />
                </div>
                <input
                  id="vehiclePlate"
                  type="text"
                  required
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase())}
                  placeholder="34ABC123"
                  maxLength={8}
                  className="w-full pl-12 pr-4 py-3 border border-outline-variant rounded-lg text-on-surface placeholder-outline focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition text-sm font-mono tracking-widest uppercase font-bold"
                />
              </div>
              <p className="text-xs text-on-surface-variant mt-1">Örn: 34ABC123 (boşluksuz girin)</p>
            </div>

            {/* Marka */}
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1.5" htmlFor="vehicleBrand">
                Araç Markası <span className="text-error">*</span>
              </label>
              <div className="relative">
                <MaterialIcon name="car_rental" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xl" />
                <select
                  id="vehicleBrand"
                  required
                  value={vehicleBrand}
                  onChange={(e) => { setVehicleBrand(e.target.value); setVehicleModel(""); }}
                  className="w-full pl-10 pr-4 py-3 border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition text-sm appearance-none bg-white"
                >
                  <option value="">Marka seçin...</option>
                  {CAR_BRANDS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                <MaterialIcon name="expand_more" className="absolute right-3 top-1/2 -translate-y-1/2 text-outline text-xl pointer-events-none" />
              </div>
            </div>

            {/* Model */}
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1.5" htmlFor="vehicleModel">
                Araç Modeli <span className="text-error">*</span>
              </label>
              <div className="relative">
                <MaterialIcon name="commute" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xl" />
                <select
                  id="vehicleModel"
                  required
                  value={vehicleModel}
                  onChange={(e) => setVehicleModel(e.target.value)}
                  disabled={!vehicleBrand}
                  className="w-full pl-10 pr-4 py-3 border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition text-sm appearance-none bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {vehicleBrand ? "Model seçin..." : "Önce marka seçin"}
                  </option>
                  {availableModels.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <MaterialIcon name="expand_more" className="absolute right-3 top-1/2 -translate-y-1/2 text-outline text-xl pointer-events-none" />
              </div>
            </div>

            {/* Araç özet kartı */}
            {vehiclePlate && vehicleBrand && vehicleModel && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center gap-4 animate-pulse-once">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                  <MaterialIcon name="directions_car" className="text-2xl text-primary" />
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant font-label uppercase tracking-wider">Aracınız</p>
                  <p className="font-headline font-bold text-on-surface">{vehicleBrand} {vehicleModel}</p>
                  <p className="font-mono text-sm text-primary font-bold tracking-widest">{vehiclePlate}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-xl font-semibold font-headline tracking-wide hover:bg-primary/90 active:scale-95 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Kayıt yapılıyor...
                </>
              ) : (
                <>
                  <MaterialIcon name="arrow_forward" className="text-xl" />
                  Devam Et
                </>
              )}
            </button>
          </form>

          <div className="text-center">
            <button
              onClick={() => { setStep("personal"); setError(null); }}
              className="text-sm text-outline hover:text-primary transition-colors flex items-center justify-center gap-1 mx-auto"
            >
              <MaterialIcon name="arrow_back" className="text-sm" />
              Kişisel bilgilere dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Personal Info Step (default) ───────────────────────────────────
  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6 border border-outline-variant/30">
        <StepIndicator current={0} total={totalSteps} />
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-secondary-container rounded-full flex items-center justify-center mx-auto">
            <MaterialIcon name="person_add" className="text-3xl text-on-secondary-fixed" />
          </div>
          <h1 className="text-2xl font-extrabold font-headline text-primary">
            Hesap Oluştur
          </h1>
          <p className="text-sm text-on-surface-variant">
            Kişisel bilgilerinizi girin.
          </p>
        </div>

        {error && (
          <div className="bg-error-container text-on-error-container text-sm rounded-lg px-4 py-3 flex items-center gap-2">
            <MaterialIcon name="error" className="text-base" />
            {error}
          </div>
        )}

        <form onSubmit={isDriver ? handlePersonalSubmit : handlePersonalSubmitNonDriver} className="space-y-4">
          {/* Ad & Soyad yan yana */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1.5" htmlFor="firstName">
                Ad <span className="text-error">*</span>
              </label>
              <div className="relative">
                <MaterialIcon name="badge" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xl" />
                <input
                  id="firstName"
                  type="text"
                  required
                  minLength={2}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Ahmet"
                  className="w-full pl-10 pr-3 py-3 border border-outline-variant rounded-lg text-on-surface placeholder-outline focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1.5" htmlFor="lastName">
                Soyad <span className="text-error">*</span>
              </label>
              <input
                id="lastName"
                type="text"
                required
                minLength={2}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Yılmaz"
                className="w-full px-3 py-3 border border-outline-variant rounded-lg text-on-surface placeholder-outline focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition text-sm"
              />
            </div>
          </div>

          {/* E-posta */}
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-1.5" htmlFor="reg-email">
              E-posta <span className="text-error">*</span>
            </label>
            <div className="relative">
              <MaterialIcon name="mail" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xl" />
              <input
                id="reg-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@email.com"
                className="w-full pl-10 pr-4 py-3 border border-outline-variant rounded-lg text-on-surface placeholder-outline focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition text-sm"
              />
            </div>
          </div>

          {/* GSM */}
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-1.5" htmlFor="gsm">
              Cep Telefonu <span className="text-error">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant font-medium">🇹🇷 +90</span>
              <input
                id="gsm"
                type="tel"
                required
                value={gsm}
                onChange={(e) => setGsm(e.target.value)}
                placeholder="532 123 4567"
                className="w-full pl-20 pr-4 py-3 border border-outline-variant rounded-lg text-on-surface placeholder-outline focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition text-sm"
              />
            </div>
          </div>

          {/* Şifre */}
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-1.5" htmlFor="reg-password">
              Şifre <span className="text-error">*</span>
            </label>
            <div className="relative">
              <MaterialIcon name="lock" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xl" />
              <input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="En az 8 karakter"
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

          <button
            type="submit"
            className="w-full bg-primary text-white py-3 rounded-xl font-semibold font-headline tracking-wide hover:bg-primary/90 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <MaterialIcon name="arrow_forward" className="text-xl" />
            {isDriver ? "Sonraki: Araç Bilgileri" : "Devam Et"}
          </button>
        </form>

        <div className="text-center space-y-2 pt-2 border-t border-outline-variant/20">
          <p className="text-sm text-on-surface-variant">
            Zaten hesabınız var mı?{" "}
            <Link href={`/login?role=${roleParam}`} className="text-primary font-semibold hover:underline">
              Giriş Yap
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

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
