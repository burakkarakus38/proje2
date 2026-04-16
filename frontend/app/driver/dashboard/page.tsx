"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MaterialIcon from "@/components/ui/MaterialIcon";
import ReservationForm from "@/components/reservation/ReservationForm";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@/types";

// ─── Dummy Data ────────────────────────────────────────────────────────────────

type SpotStatus = "empty" | "reserved" | "occupied";

interface ParkingSpot {
  id: string;
  status: SpotStatus;
  number: string;
}

interface ParkingLot {
  id: string;
  name: string;
  address: string;
  distance: string;
  rating: number;
  pricePerHour: number;
  totalSpots: number;
  emptySpots: number;
  reservedSpots: number;
  occupiedSpots: number;
  features: string[];
  spots: ParkingSpot[];
  open24h: boolean;
  isOpen: boolean;
}

function generateSpots(total: number, empty: number, reserved: number): ParkingSpot[] {
  const spots: ParkingSpot[] = [];
  const statuses: SpotStatus[] = [
    ...Array(empty).fill("empty"),
    ...Array(reserved).fill("reserved"),
    ...Array(total - empty - reserved).fill("occupied"),
  ];
  // shuffle
  for (let i = statuses.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [statuses[i], statuses[j]] = [statuses[j], statuses[i]];
  }
  for (let i = 0; i < total; i++) {
    spots.push({ id: `spot-${i}`, status: statuses[i], number: String(i + 1).padStart(2, "0") });
  }
  return spots;
}

const DUMMY_LOTS: ParkingLot[] = [
  {
    id: "lot-1",
    name: "Taksim Merkez Otopark",
    address: "Taksim Meydanı Altı, Beyoğlu, İstanbul",
    distance: "0.3 km",
    rating: 4.7,
    pricePerHour: 40,
    totalSpots: 48,
    emptySpots: 12,
    reservedSpots: 8,
    occupiedSpots: 28,
    features: ["Kapalı", "7/24", "Güvenlik", "Engelli"],
    open24h: true,
    isOpen: true,
    spots: generateSpots(48, 12, 8),
  },
  {
    id: "lot-2",
    name: "Kadıköy İskele Parkı",
    address: "Rıhtım Caddesi No:14, Kadıköy, İstanbul",
    distance: "1.1 km",
    rating: 4.3,
    pricePerHour: 25,
    totalSpots: 36,
    emptySpots: 2,
    reservedSpots: 5,
    occupiedSpots: 29,
    features: ["Açık", "06:00–23:00", "Kamera"],
    open24h: false,
    isOpen: true,
    spots: generateSpots(36, 2, 5),
  },
  {
    id: "lot-3",
    name: "Beşiktaş Çarşı Otoparkı",
    address: "Sinanpaşa Mah. Çarşı Cd., Beşiktaş, İstanbul",
    distance: "2.4 km",
    rating: 4.5,
    pricePerHour: 35,
    totalSpots: 60,
    emptySpots: 22,
    reservedSpots: 11,
    occupiedSpots: 27,
    features: ["Kapalı", "7/24", "Yıkama", "Şarj"],
    open24h: true,
    isOpen: true,
    spots: generateSpots(60, 22, 11),
  },
  {
    id: "lot-4",
    name: "Üsküdar Meydan Park",
    address: "Hakimiyet-i Milliye Cd. No:2, Üsküdar, İstanbul",
    distance: "3.8 km",
    rating: 3.9,
    pricePerHour: 20,
    totalSpots: 24,
    emptySpots: 0,
    reservedSpots: 3,
    occupiedSpots: 21,
    features: ["Açık", "07:00–22:00"],
    open24h: false,
    isOpen: true,
    spots: generateSpots(24, 0, 3),
  },
  {
    id: "lot-5",
    name: "Şişli Mecidiyeköy AVM Altı",
    address: "Büyükdere Cad. No:185, Şişli, İstanbul",
    distance: "4.2 km",
    rating: 4.6,
    pricePerHour: 45,
    totalSpots: 80,
    emptySpots: 35,
    reservedSpots: 14,
    occupiedSpots: 31,
    features: ["Kapalı", "7/24", "Şarj", "Engelli", "Kamera"],
    open24h: true,
    isOpen: true,
    spots: generateSpots(80, 35, 14),
  },
];

// ─── Sub-Components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: SpotStatus }) {
  const map = {
    empty: { bg: "bg-green-500", label: "Boş", icon: "check_circle" },
    reserved: { bg: "bg-yellow-400", label: "Rezerve", icon: "event_available" },
    occupied: { bg: "bg-red-500", label: "Dolu", icon: "block" },
  };
  const { bg, label, icon } = map[status];
  return (
    <span className={`inline-flex items-center gap-1 ${bg} text-white text-xs font-medium px-2 py-0.5 rounded-full`}>
      <MaterialIcon name={icon} className="text-xs" />
      {label}
    </span>
  );
}

function OccupancyBar({ lot }: { lot: ParkingLot }) {
  const emptyPct = (lot.emptySpots / lot.totalSpots) * 100;
  const reservedPct = (lot.reservedSpots / lot.totalSpots) * 100;
  const occupiedPct = (lot.occupiedSpots / lot.totalSpots) * 100;

  return (
    <div className="w-full h-3 rounded-full overflow-hidden flex bg-gray-100">
      <div className="bg-red-500 transition-all duration-500 h-full" style={{ width: `${occupiedPct}%` }} title={`Dolu: ${lot.occupiedSpots}`} />
      <div className="bg-yellow-400 transition-all duration-500 h-full" style={{ width: `${reservedPct}%` }} title={`Rezerve: ${lot.reservedSpots}`} />
      <div className="bg-green-500 transition-all duration-500 h-full" style={{ width: `${emptyPct}%` }} title={`Boş: ${lot.emptySpots}`} />
    </div>
  );
}

function ParkingGrid({ spots }: { spots: ParkingSpot[] }) {
  const spotColors: Record<SpotStatus, string> = {
    empty: "bg-green-100 border-green-400 text-green-700 hover:bg-green-200",
    reserved: "bg-yellow-100 border-yellow-400 text-yellow-700 hover:bg-yellow-200",
    occupied: "bg-red-100 border-red-400 text-red-500 cursor-not-allowed",
  };
  const spotIcons: Record<SpotStatus, string> = {
    empty: "local_parking",
    reserved: "event_busy",
    occupied: "directions_car",
  };

  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(52px, 1fr))" }}>
      {spots.map((spot) => (
        <div
          key={spot.id}
          title={`${spot.number} – ${spot.status === "empty" ? "Boş" : spot.status === "reserved" ? "Rezerve" : "Dolu"}`}
          className={`border-2 rounded-lg p-1.5 flex flex-col items-center justify-center transition-all duration-200 cursor-pointer select-none ${spotColors[spot.status]}`}
          style={{ minHeight: 52 }}
        >
          <MaterialIcon name={spotIcons[spot.status]} className="text-lg leading-none" />
          <span className="text-[10px] font-bold font-mono mt-0.5">{spot.number}</span>
        </div>
      ))}
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <MaterialIcon
          key={s}
          name={s <= Math.floor(rating) ? "star" : s - 0.5 <= rating ? "star_half" : "star_border"}
          className="text-secondary text-sm"
        />
      ))}
      <span className="text-xs text-on-surface-variant ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

function LotCard({ lot, onSelect, selected }: { lot: ParkingLot; onSelect: () => void; selected: boolean }) {
  const emptyPct = Math.round((lot.emptySpots / lot.totalSpots) * 100);
  const statusColor = lot.emptySpots === 0
    ? "border-red-300 bg-red-50"
    : lot.emptySpots <= 5
    ? "border-yellow-300 bg-yellow-50"
    : "border-green-300 bg-green-50";

  return (
    <div
      onClick={onSelect}
      className={`rounded-2xl border-2 p-5 cursor-pointer transition-all duration-300 hover:shadow-lg ${
        selected ? "border-primary bg-primary/5 shadow-md" : `${statusColor} hover:shadow-md`
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-headline font-bold text-on-surface text-sm leading-tight truncate">{lot.name}</h3>
            {lot.open24h && (
              <span className="shrink-0 text-[10px] bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded-full">7/24</span>
            )}
          </div>
          <StarRating rating={lot.rating} />
          <p className="text-xs text-on-surface-variant mt-1 flex items-center gap-1">
            <MaterialIcon name="location_on" className="text-xs text-outline" />
            <span className="truncate">{lot.address}</span>
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xl font-extrabold text-primary font-headline">₺{lot.pricePerHour}</p>
          <p className="text-[10px] text-on-surface-variant">/saat</p>
          <p className="text-xs text-outline mt-1 flex items-center gap-0.5 justify-end">
            <MaterialIcon name="near_me" className="text-xs" />
            {lot.distance}
          </p>
        </div>
      </div>

      {/* Doluluk bar */}
      <OccupancyBar lot={lot} />

      {/* Stats */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-green-600 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
            {lot.emptySpots} boş
          </span>
          <span className="flex items-center gap-1 text-yellow-600 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" />
            {lot.reservedSpots} rezerve
          </span>
          <span className="flex items-center gap-1 text-red-500 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
            {lot.occupiedSpots} dolu
          </span>
        </div>
        <span className="text-xs text-on-surface-variant font-medium bg-surface-container px-2 py-1 rounded-lg">
          %{emptyPct} boş
        </span>
      </div>

      {/* Features */}
      <div className="flex flex-wrap gap-1.5 mt-3">
        {lot.features.map((f) => (
          <span key={f} className="text-[10px] bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-full">
            {f}
          </span>
        ))}
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-4 h-4 rounded ${color} border border-black/10`} />
      <span className="text-xs text-on-surface-variant">{label}</span>
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────

export default function DriverDashboard() {
  const router = useRouter();
  const { logout, getCurrentUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [selectedLot, setSelectedLot] = useState<ParkingLot | null>(DUMMY_LOTS[0]);
  const [activeTab, setActiveTab] = useState<"list" | "grid">("list");
  const [sortBy, setSortBy] = useState<"distance" | "price" | "empty">("distance");
  const [showReservation, setShowReservation] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) { router.replace("/login?role=driver"); return; }
    if (currentUser.role !== "USER") { router.replace("/"); return; }
    setUser(currentUser);
  }, [getCurrentUser, router]);

  if (!user) return null;

  const sortedLots = [...DUMMY_LOTS].sort((a, b) => {
    if (sortBy === "price") return a.pricePerHour - b.pricePerHour;
    if (sortBy === "empty") return b.emptySpots - a.emptySpots;
    return parseFloat(a.distance) - parseFloat(b.distance);
  });

  const totalEmpty = DUMMY_LOTS.reduce((s, l) => s + l.emptySpots, 0);
  const totalReserved = DUMMY_LOTS.reduce((s, l) => s + l.reservedSpots, 0);
  const totalOccupied = DUMMY_LOTS.reduce((s, l) => s + l.occupiedSpots, 0);

  return (
    <>
      <Header />
      <main className="flex-grow portal-gradient pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          {/* ── Welcome Banner ─────────────────────────────────────── */}
          <div className="relative overflow-hidden bg-primary-container rounded-2xl p-6 md:p-8 text-white mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* decorative circle */}
            <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/5" />
            <div className="absolute -right-4 -bottom-12 w-40 h-40 rounded-full bg-white/5" />

            <div className="relative z-10">
              <p className="text-on-primary-container/70 text-xs font-label uppercase tracking-widest mb-1">Şoför Paneli</p>
              <h1 className="text-2xl md:text-3xl font-extrabold font-headline">
                Hoş Geldiniz, {user.name || user.email}! 👋
              </h1>
              <p className="text-on-primary-container/70 text-sm mt-1">{user.email}</p>
              {/* Araç bilgisi varsa göster */}
              {user.vehiclePlate && (
                <div className="mt-3 inline-flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2 border border-white/20">
                  <MaterialIcon name="directions_car" className="text-xl" />
                  <span className="font-mono font-bold tracking-widest text-sm">{user.vehiclePlate}</span>
                  {user.vehicleBrand && <span className="text-white/70 text-sm">· {user.vehicleBrand} {user.vehicleModel}</span>}
                </div>
              )}
            </div>

            {/* Quick stats */}
            <div className="relative z-10 flex gap-3 flex-wrap">
              <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-center min-w-[80px]">
                <p className="text-2xl font-extrabold font-headline text-green-300">{totalEmpty}</p>
                <p className="text-xs text-white/70 mt-0.5">Boş Alan</p>
              </div>
              <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-center min-w-[80px]">
                <p className="text-2xl font-extrabold font-headline text-yellow-300">{totalReserved}</p>
                <p className="text-xs text-white/70 mt-0.5">Rezerve</p>
              </div>
              <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-center min-w-[80px]">
                <p className="text-2xl font-extrabold font-headline text-red-300">{totalOccupied}</p>
                <p className="text-xs text-white/70 mt-0.5">Dolu</p>
              </div>
            </div>
          </div>

          {/* ── Main Grid ─────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

            {/* Left: Lot List */}
            <div className="lg:col-span-2 space-y-4">
              {/* Controls */}
              <div className="flex items-center justify-between gap-3 flex-wrap bg-white rounded-xl p-3 border border-outline-variant/20 shadow-sm">
                <p className="text-sm font-semibold text-on-surface font-headline">
                  Yakın Otoparklar
                  <span className="ml-2 text-xs text-on-surface-variant font-label font-normal">({DUMMY_LOTS.length} otopark)</span>
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-on-surface-variant">Sırala:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="text-xs border border-outline-variant rounded-lg px-2 py-1.5 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/40 bg-white"
                  >
                    <option value="distance">Mesafe</option>
                    <option value="price">Fiyat</option>
                    <option value="empty">Boş Alan</option>
                  </select>
                </div>
              </div>

              {/* Lot Cards */}
              <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1 scrollbar-thin">
                {sortedLots.map((lot) => (
                  <LotCard
                    key={lot.id}
                    lot={lot}
                    selected={selectedLot?.id === lot.id}
                    onSelect={() => { setSelectedLot(lot); setActiveTab("grid"); }}
                  />
                ))}
              </div>
            </div>

            {/* Right: Detail / Grid */}
            <div className="lg:col-span-3">
              {selectedLot ? (
                <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm overflow-hidden">
                  {/* Lot Header */}
                  <div className="bg-gradient-to-r from-primary-container to-primary p-5 text-white">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs text-white/60 uppercase tracking-wider mb-1">Seçili Otopark</p>
                        <h2 className="text-xl font-extrabold font-headline">{selectedLot.name}</h2>
                        <p className="text-white/70 text-sm mt-1 flex items-center gap-1">
                          <MaterialIcon name="location_on" className="text-sm" />
                          {selectedLot.address}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-3xl font-extrabold font-headline">₺{selectedLot.pricePerHour}</p>
                        <p className="text-white/60 text-xs">/saat</p>
                      </div>
                    </div>

                    {/* Summary status strip */}
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {[
                        { label: "Boş", value: selectedLot.emptySpots, bg: "bg-green-500/20 border-green-400/30", text: "text-green-200" },
                        { label: "Rezerve", value: selectedLot.reservedSpots, bg: "bg-yellow-400/20 border-yellow-400/30", text: "text-yellow-200" },
                        { label: "Dolu", value: selectedLot.occupiedSpots, bg: "bg-red-500/20 border-red-400/30", text: "text-red-200" },
                      ].map((s) => (
                        <div key={s.label} className={`${s.bg} border rounded-xl p-2 text-center`}>
                          <p className={`text-xl font-extrabold ${s.text} font-headline`}>{s.value}</p>
                          <p className="text-white/60 text-xs">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex border-b border-outline-variant/20">
                    {(["list", "grid"] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-3 text-sm font-medium font-headline transition-colors flex items-center justify-center gap-2 ${
                          activeTab === tab
                            ? "text-primary border-b-2 border-primary bg-primary/5"
                            : "text-on-surface-variant hover:text-on-surface"
                        }`}
                      >
                        <MaterialIcon name={tab === "list" ? "info" : "grid_view"} className="text-base" />
                        {tab === "list" ? "Bilgiler" : "Park Haritası"}
                      </button>
                    ))}
                  </div>

                  <div className="p-5">
                    {activeTab === "list" ? (
                      /* Info Tab */
                      <div className="space-y-5">
                        <div>
                          <p className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Özellikler</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedLot.features.map((f) => (
                              <span key={f} className="flex items-center gap-1 bg-primary/10 text-primary text-sm px-3 py-1 rounded-full font-medium">
                                <MaterialIcon name="check" className="text-sm" />
                                {f}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Doluluk Durumu</p>
                          <OccupancyBar lot={selectedLot} />
                          <div className="flex justify-between mt-2 text-xs text-on-surface-variant">
                            <span>%{Math.round((selectedLot.occupiedSpots / selectedLot.totalSpots) * 100)} dolu</span>
                            <span>Toplam {selectedLot.totalSpots} yer</span>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Fiyatlandırma</p>
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { label: "Saatlik", price: selectedLot.pricePerHour },
                              { label: "Günlük (8 saat)", price: selectedLot.pricePerHour * 8 * 0.8 },
                              { label: "Aylık (tahmini)", price: selectedLot.pricePerHour * 8 * 22 * 0.6 },
                              { label: "30 Dakika", price: Math.round(selectedLot.pricePerHour / 2) },
                            ].map((p) => (
                              <div key={p.label} className="bg-surface-container rounded-xl p-3 flex items-center justify-between">
                                <span className="text-xs text-on-surface-variant">{p.label}</span>
                                <span className="font-bold text-primary text-sm font-headline">₺{Math.round(p.price)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowReservation(true)}
                          className="w-full bg-primary text-white py-3 rounded-xl font-semibold font-headline tracking-wide hover:bg-primary/90 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
                        >
                          <MaterialIcon name="bookmark_added" className="text-xl" />
                          Rezervasyon Yap
                        </button>
                      </div>
                    ) : (
                      /* Grid Tab */
                      <div className="space-y-4">
                        {/* Legend */}
                        <div className="flex items-center gap-4 flex-wrap bg-surface-container rounded-xl px-4 py-3">
                          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mr-1">Açıklama:</p>
                          <LegendItem color="bg-green-100 border-green-400" label="Boş" />
                          <LegendItem color="bg-yellow-100 border-yellow-400" label="Rezerve" />
                          <LegendItem color="bg-red-100 border-red-400" label="Dolu" />
                        </div>

                        <ParkingGrid spots={selectedLot.spots} />

                        <p className="text-xs text-center text-on-surface-variant">
                          Boş alandaki park yerine tıklayarak rezervasyon yapabilirsiniz.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm p-12 flex flex-col items-center justify-center text-center">
                  <MaterialIcon name="local_parking" className="text-6xl text-outline mb-4" />
                  <p className="text-on-surface-variant">Sol taraftan bir otopark seçin.</p>
                </div>
              )}

              {/* Logout */}
              <div className="flex justify-end mt-4">
                <button
                  onClick={logout}
                  className="flex items-center gap-2 text-sm text-outline hover:text-error transition-colors font-medium"
                >
                  <MaterialIcon name="logout" className="text-xl" />
                  Çıkış Yap
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* ── Reservation Modal ────────────────────────────────────── */}
      {showReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowReservation(false)}
          />
          {/* Modal */}
          <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            {/* Close button */}
            <button
              onClick={() => setShowReservation(false)}
              className="absolute top-3 right-3 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 shadow hover:bg-white transition-colors"
            >
              <MaterialIcon name="close" className="text-xl text-on-surface" />
            </button>
            <ReservationForm
              onSuccess={() => {
                setShowReservation(false);
              }}
              onError={(err) => console.error("Reservation error:", err)}
            />
          </div>
        </div>
      )}
    </>
  );
}
