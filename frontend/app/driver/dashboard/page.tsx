"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MaterialIcon from "@/components/ui/MaterialIcon";
import ReservationForm from "@/components/reservation/ReservationForm";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@/types";
import { parkingLotApi } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

type SpotStatus = "empty" | "reserved" | "occupied";

interface ParkingSpot {
  id: string;
  status: SpotStatus;
  number: string;
}

interface ParkingLot {
  id: number;
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

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateSpots(total: number, empty: number, reserved: number): ParkingSpot[] {
  const spots: ParkingSpot[] = [];
  const statuses: SpotStatus[] = [
    ...Array(empty).fill("empty"),
    ...Array(reserved).fill("reserved"),
    ...Array(Math.max(0, total - empty - reserved)).fill("occupied"),
  ];
  // shuffle
  for (let i = statuses.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [statuses[i], statuses[j]] = [statuses[j], statuses[i]];
  }
  for (let i = 0; i < total; i++) {
    spots.push({ id: `spot-${i}`, status: statuses[i] || "occupied", number: String(i + 1).padStart(2, "0") });
  }
  return spots;
}

const DUMMY_LOTS: ParkingLot[] = [
  {
    id: 1,
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
    id: 2,
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

function ParkingGrid({ spots, onSpotClick }: { spots: ParkingSpot[]; onSpotClick?: (id: string) => void }) {
  const spotColors: Record<SpotStatus, string> = {
    empty: "bg-green-100 border-green-400 text-green-700 hover:bg-green-200 hover:scale-105 shadow-sm",
    reserved: "bg-yellow-100 border-yellow-400 text-yellow-700 hover:bg-yellow-200",
    occupied: "bg-red-100 border-red-400 text-red-500 cursor-not-allowed opacity-60",
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
          onClick={() => spot.status === "empty" && onSpotClick?.(spot.id)}
          title={`${spot.number} – ${spot.status === "empty" ? "Boş (Rezervasyon İçin Tıklayın)" : spot.status === "reserved" ? "Rezerve" : "Dolu"}`}
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
        </div>
      </div>
      <OccupancyBar lot={lot} />
      <div className="flex items-center justify-between mt-3 text-[10px] font-semibold">
        <span className="text-green-600">{lot.emptySpots} boş</span>
        <span className="text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-lg">%{emptyPct} müsait</span>
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
  const [lots, setLots] = useState<ParkingLot[]>(DUMMY_LOTS);
  const [selectedLot, setSelectedLot] = useState<ParkingLot | null>(DUMMY_LOTS[0]);
  const [activeTab, setActiveTab] = useState<"list" | "grid">("list");
  const [sortBy, setSortBy] = useState<"distance" | "price" | "empty">("distance");
  const [showReservation, setShowReservation] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchLots = async () => {
    try {
      const { data } = await parkingLotApi.getAll();
      if (data?.success && data.data && (data.data as any[]).length > 0) {
        const transformed: ParkingLot[] = (data.data as any[]).map((lot: any) => ({
          id: lot.id,
          name: lot.name,
          address: lot.address || "Adres bilgisi yok",
          distance: "0.0 km",
          rating: 4.5,
          pricePerHour: lot.hourlyRate,
          totalSpots: lot.capacity,
          emptySpots: lot.availableCapacity || (lot.capacity - lot.currentOccupancy),
          reservedSpots: Math.floor(lot.capacity * 0.1),
          occupiedSpots: lot.currentOccupancy,
          features: ["Real-time", lot.workingHours || "24/7"],
          open24h: lot.workingHours?.includes("24/7") || true,
          isOpen: true,
          spots: generateSpots(
            lot.capacity,
            lot.availableCapacity || (lot.capacity - lot.currentOccupancy),
            Math.floor(lot.capacity * 0.1)
          ),
        }));
        setLots(transformed);
        setSelectedLot(transformed[0]);
      }
    } catch (err) {
      console.error("Fetch lots error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLots();
  }, []);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) { router.replace("/login?role=driver"); return; }
    if (currentUser.role !== "USER") { router.replace("/"); return; }
    setUser(currentUser);
  }, [getCurrentUser, router]);

  if (!user) return null;

  const sortedLots = [...lots].sort((a, b) => {
    if (sortBy === "price") return a.pricePerHour - b.pricePerHour;
    if (sortBy === "empty") return b.emptySpots - a.emptySpots;
    return 0;
  });

  return (
    <>
      <Header />
      <main className="flex-grow portal-gradient pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          {/* Banner */}
          <div className="relative overflow-hidden bg-primary-container rounded-2xl p-6 md:p-8 text-white mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="relative z-10">
              <p className="text-on-primary-container/70 text-xs font-label uppercase tracking-widest mb-1">Şoför Paneli</p>
              <h1 className="text-2xl md:text-3xl font-extrabold font-headline">Hoş Geldiniz, {user.name || user.email}! 👋</h1>
              <p className="text-on-primary-container/70 text-sm mt-1">{user.email}</p>
              {user.vehiclePlate && (
                <div className="mt-3 inline-flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2 border border-white/20">
                  <MaterialIcon name="directions_car" className="text-xl" />
                  <span className="font-mono font-bold tracking-widest text-sm">{user.vehiclePlate}</span>
                </div>
              )}
            </div>
            <div className="relative z-10 flex gap-3">
              <div className="bg-white/10 rounded-xl px-4 py-3 text-center min-w-[80px]">
                <p className="text-2xl font-extrabold text-green-300">{lots.reduce((s,l) => s+l.emptySpots, 0)}</p>
                <p className="text-[10px] text-white/70">Toplam Boş</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left: List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-xl p-3 border border-outline-variant/20 shadow-sm flex items-center justify-between">
                <p className="text-sm font-semibold">Otoparklar ({lots.length})</p>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="text-xs border rounded-lg px-2 py-1">
                  <option value="distance">Mesafe</option>
                  <option value="price">Fiyat</option>
                  <option value="empty">Müsaitlik</option>
                </select>
              </div>

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

            {/* Right: Map/Grid */}
            <div className="lg:col-span-3">
              {selectedLot ? (
                <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm overflow-hidden min-h-[500px]">
                  <div className="bg-gradient-to-r from-primary-container to-primary p-5 text-white">
                    <h2 className="text-xl font-extrabold font-headline">{selectedLot.name}</h2>
                    <p className="text-white/70 text-sm mt-1">{selectedLot.address}</p>
                    <div className="mt-4 flex gap-4">
                      <div className="bg-green-500/20 border border-green-400/30 rounded-xl px-4 py-2 text-center flex-1">
                        <p className="text-xl font-bold text-green-200">{selectedLot.emptySpots}</p>
                        <p className="text-[10px] text-white/60">Boş Yer</p>
                      </div>
                      <div className="bg-white/10 rounded-xl px-4 py-2 text-center flex-1">
                        <p className="text-xl font-bold">₺{selectedLot.pricePerHour}</p>
                        <p className="text-[10px] text-white/60">Saat Ücreti</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex border-b">
                    {(["list", "grid"] as const).map((tab) => (
                      <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3 text-sm font-headline ${activeTab === tab ? "text-primary border-b-2 border-primary bg-primary/5" : "text-on-surface-variant hover:bg-gray-50"}`}>
                        {tab === "list" ? "Otopark Bilgisi" : "Park Haritası (Tıkla & Rezerv Et)"}
                      </button>
                    ))}
                  </div>

                  <div className="p-5">
                    {activeTab === "list" ? (
                      <div className="space-y-6">
                        <div className="flex flex-wrap gap-2">
                          {selectedLot.features.map(f => <span key={f} className="text-xs bg-gray-100 px-3 py-1 rounded-full">{f}</span>)}
                        </div>
                        <button onClick={() => setShowReservation(true)} className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-primary/20 transition-all">
                          Hemen Rezervasyon Yap
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex gap-4 mb-4">
                          <LegendItem color="bg-green-100 border-green-400" label="Müsait (Tıkla)" />
                          <LegendItem color="bg-red-100 border-red-400" label="Dolu" />
                        </div>
                        <ParkingGrid spots={selectedLot.spots} onSpotClick={() => setShowReservation(true)} />
                        <p className="text-[11px] text-center text-outline mt-4">Yeşil alanlar boş park yerlerini temsil eder. Tıklayarak hızlıca rezervasyon oluşturabilirsiniz.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm p-12 text-center">
                  <MaterialIcon name="search" className="text-5xl text-outline mb-2" />
                  <p className="text-on-surface-variant">Lütfen işlem yapmak için bir otopark seçin.</p>
                </div>
              )}
              
              <div className="flex justify-end mt-4">
                <button onClick={logout} className="flex items-center gap-2 text-sm text-outline hover:text-error transition-colors">
                  <MaterialIcon name="logout" className="text-xl" />
                  Çıkış Yap
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {showReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowReservation(false)} />
          <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowReservation(false)} className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-xl">
              <MaterialIcon name="close" />
            </button>
            {selectedLot && (
              <ReservationForm 
                initialParkingLotId={selectedLot.id} 
                onSuccess={() => { setShowReservation(false); fetchLots(); }} 
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
