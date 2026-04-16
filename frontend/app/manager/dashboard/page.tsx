"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MaterialIcon from "@/components/ui/MaterialIcon";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@/types";

// ─── Types ─────────────────────────────────────────────────────────────────────

type SpotStatus = "empty" | "reserved" | "occupied";
type TabKey = "overview" | "spots" | "reservations" | "revenue";

interface ParkingSpot {
  id: string;
  number: string;
  floor: string;
  status: SpotStatus;
  vehiclePlate?: string;
  vehicleBrand?: string;
  since?: string;
  reservedBy?: string;
  reservedUntil?: string;
}

interface Reservation {
  id: string;
  customerName: string;
  phone: string;
  vehiclePlate: string;
  vehicleBrand: string;
  spotNumber: string;
  startTime: string;
  endTime: string;
  status: "active" | "upcoming" | "completed" | "cancelled";
  amount: number;
}

interface RevenueEntry {
  date: string;
  dayLabel: string;
  income: number;
  reservations: number;
}

interface ActivityLog {
  id: string;
  icon: string;
  message: string;
  time: string;
  color: string;
}

// ─── Dummy Data Generator ──────────────────────────────────────────────────────

const FLOORS = ["B2", "B1", "Zemin", "1. Kat", "2. Kat"];
const PLATES = ["34ABC123", "06DEF456", "35GHI789", "16JKL012", "41MNO345", "07PQR678", "34STU901", "01VWX234", "55YZA567", "26BCD890"];
const BRANDS = ["BMW 3 Serisi", "Mercedes C200", "Toyota Corolla", "VW Golf", "Audi A4", "Ford Focus", "Renault Clio", "Hyundai i20", "Fiat Egea", "Kia Sportage"];
const NAMES = ["Ahmet Yılmaz", "Fatma Demir", "Mehmet Kaya", "Ayşe Çelik", "Ali Özkan", "Zeynep Aktaş", "Mustafa Koç", "Elif Aydın", "Burak Şahin", "Seda Arslan"];

function generateSpots(): ParkingSpot[] {
  const spots: ParkingSpot[] = [];
  let idx = 0;
  FLOORS.forEach((floor) => {
    const count = floor === "Zemin" ? 20 : floor.startsWith("B") ? 16 : 14;
    for (let i = 1; i <= count; i++) {
      const rand = Math.random();
      let status: SpotStatus;
      if (rand < 0.42) status = "occupied";
      else if (rand < 0.58) status = "reserved";
      else status = "empty";

      const spot: ParkingSpot = {
        id: `spot-${idx}`,
        number: `${floor.replace(". Kat", "K").replace("Zemin", "Z")}-${String(i).padStart(2, "0")}`,
        floor,
        status,
      };

      if (status === "occupied") {
        const pi = idx % PLATES.length;
        spot.vehiclePlate = PLATES[pi];
        spot.vehicleBrand = BRANDS[pi];
        const h = Math.floor(Math.random() * 5) + 1;
        spot.since = `${h} saat önce`;
      } else if (status === "reserved") {
        const ni = idx % NAMES.length;
        spot.reservedBy = NAMES[ni];
        spot.reservedUntil = `${Math.floor(Math.random() * 3) + 1} saat sonra`;
      }

      spots.push(spot);
      idx++;
    }
  });
  return spots;
}

function generateReservations(): Reservation[] {
  const statuses: Reservation["status"][] = ["active", "active", "upcoming", "upcoming", "completed", "completed", "completed", "completed", "cancelled", "active"];
  return NAMES.map((name, i) => ({
    id: `res-${i}`,
    customerName: name,
    phone: `053${i}${i}${i}1234${i}`,
    vehiclePlate: PLATES[i],
    vehicleBrand: BRANDS[i],
    spotNumber: `Z-${String(i + 1).padStart(2, "0")}`,
    startTime: i < 4 ? "Bugün 10:00" : i < 7 ? "Bugün 14:00" : "Dün 09:00",
    endTime: i < 4 ? "Bugün 14:00" : i < 7 ? "Bugün 18:00" : "Dün 17:00",
    status: statuses[i],
    amount: (Math.floor(Math.random() * 6) + 2) * 35,
  }));
}

function generateRevenue(): RevenueEntry[] {
  const days = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
  return days.map((day, i) => ({
    date: `2026-04-${String(10 + i).padStart(2, "0")}`,
    dayLabel: day,
    income: Math.floor(Math.random() * 3000) + 2000,
    reservations: Math.floor(Math.random() * 20) + 10,
  }));
}

const ACTIVITY_LOG: ActivityLog[] = [
  { id: "a1", icon: "directions_car", message: "34ABC123 plakalı araç B1-05'e giriş yaptı", time: "2 dk önce", color: "text-green-500" },
  { id: "a2", icon: "bookmark_added", message: "Ahmet Yılmaz Z-03 için rezervasyon oluşturdu", time: "8 dk önce", color: "text-yellow-500" },
  { id: "a3", icon: "payments", message: "₺140 ödeme alındı — 06DEF456", time: "15 dk önce", color: "text-primary" },
  { id: "a4", icon: "exit_to_app", message: "35GHI789 plakalı araç 1K-12'den çıkış yaptı", time: "22 dk önce", color: "text-red-400" },
  { id: "a5", icon: "cancel", message: "Zeynep Aktaş rezervasyonunu iptal etti", time: "35 dk önce", color: "text-outline" },
  { id: "a6", icon: "directions_car", message: "16JKL012 plakalı araç Z-08'e giriş yaptı", time: "41 dk önce", color: "text-green-500" },
  { id: "a7", icon: "payments", message: "₺210 ödeme alındı — 41MNO345", time: "1 sa önce", color: "text-primary" },
  { id: "a8", icon: "warning", message: "B2 katında sensör uyarısı — kontrol edin", time: "1.5 sa önce", color: "text-orange-500" },
];

// ─── Sub-Components ────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, accent }: { icon: string; label: string; value: string | number; sub?: string; accent: string }) {
  return (
    <div className="bg-white rounded-2xl border border-outline-variant/20 p-5 hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${accent} transition-transform group-hover:scale-110`}>
          <MaterialIcon name={icon} className="text-xl text-white" />
        </div>
        <MaterialIcon name="trending_up" className="text-lg text-green-400" />
      </div>
      <p className="text-2xl font-extrabold font-headline text-on-surface">{value}</p>
      <p className="text-xs text-on-surface-variant mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-green-500 font-medium mt-1">{sub}</p>}
    </div>
  );
}

function OccupancyDonut({ empty, reserved, occupied, total }: { empty: number; reserved: number; occupied: number; total: number }) {
  const ePct = (empty / total) * 100;
  const rPct = (reserved / total) * 100;
  const oPct = (occupied / total) * 100;
  const r = 54;
  const c = 2 * Math.PI * r;
  const oLen = (oPct / 100) * c;
  const rLen = (rPct / 100) * c;
  const eLen = (ePct / 100) * c;

  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#e5e7eb" strokeWidth="12" />
        {/* occupied */}
        <circle cx="60" cy="60" r={r} fill="none" stroke="#ef4444" strokeWidth="12"
          strokeDasharray={`${oLen} ${c - oLen}`} strokeDashoffset="0" strokeLinecap="round" className="transition-all duration-700" />
        {/* reserved */}
        <circle cx="60" cy="60" r={r} fill="none" stroke="#fbbf24" strokeWidth="12"
          strokeDasharray={`${rLen} ${c - rLen}`} strokeDashoffset={`${-oLen}`} strokeLinecap="round" className="transition-all duration-700" />
        {/* empty */}
        <circle cx="60" cy="60" r={r} fill="none" stroke="#22c55e" strokeWidth="12"
          strokeDasharray={`${eLen} ${c - eLen}`} strokeDashoffset={`${-(oLen + rLen)}`} strokeLinecap="round" className="transition-all duration-700" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold font-headline text-on-surface">{total}</span>
        <span className="text-[10px] text-on-surface-variant">toplam yer</span>
      </div>
    </div>
  );
}

function RevenueBarChart({ data }: { data: RevenueEntry[] }) {
  const max = Math.max(...data.map((d) => d.income));
  return (
    <div className="flex items-end gap-2 h-40 mt-4">
      {data.map((d) => {
        const h = (d.income / max) * 100;
        return (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
            <span className="text-[10px] text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity font-mono">
              ₺{d.income.toLocaleString("tr-TR")}
            </span>
            <div className="w-full relative rounded-t-lg overflow-hidden bg-gray-100" style={{ height: `${h}%`, minHeight: 8 }}>
              <div className="absolute inset-0 bg-gradient-to-t from-primary to-primary/60 transition-all duration-300 group-hover:from-secondary group-hover:to-secondary/80" />
            </div>
            <span className="text-[10px] text-on-surface-variant font-medium">{d.dayLabel.slice(0, 3)}</span>
          </div>
        );
      })}
    </div>
  );
}

const SPOT_COLORS: Record<SpotStatus, string> = {
  empty: "bg-green-100 border-green-400 text-green-700 hover:bg-green-200 hover:shadow-sm",
  reserved: "bg-yellow-100 border-yellow-400 text-yellow-700 hover:bg-yellow-200 hover:shadow-sm",
  occupied: "bg-red-100 border-red-400 text-red-500",
};
const SPOT_ICONS: Record<SpotStatus, string> = {
  empty: "local_parking",
  reserved: "event_busy",
  occupied: "directions_car",
};

function ParkingFloorGrid({ spots, floor }: { spots: ParkingSpot[]; floor: string }) {
  const floorSpots = spots.filter((s) => s.floor === floor);
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <MaterialIcon name="layers" className="text-sm text-primary" />
        </div>
        <h4 className="font-headline font-bold text-sm text-on-surface">{floor}</h4>
        <span className="text-xs text-on-surface-variant ml-auto">
          {floorSpots.filter((s) => s.status === "empty").length} boş / {floorSpots.length} yer
        </span>
      </div>
      <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(56px, 1fr))" }}>
        {floorSpots.map((spot) => (
          <div
            key={spot.id}
            title={`${spot.number} — ${spot.status === "empty" ? "Boş" : spot.status === "reserved" ? `Rezerve: ${spot.reservedBy}` : `Dolu: ${spot.vehiclePlate}`}`}
            className={`border-2 rounded-lg p-1.5 flex flex-col items-center justify-center transition-all duration-200 cursor-pointer select-none ${SPOT_COLORS[spot.status]}`}
            style={{ minHeight: 54 }}
          >
            <MaterialIcon name={SPOT_ICONS[spot.status]} className="text-lg leading-none" />
            <span className="text-[9px] font-bold font-mono mt-0.5">{spot.number}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const RES_STATUS_MAP: Record<Reservation["status"], { bg: string; label: string; icon: string }> = {
  active: { bg: "bg-green-100 text-green-700", label: "Aktif", icon: "play_circle" },
  upcoming: { bg: "bg-blue-100 text-blue-700", label: "Yaklaşan", icon: "schedule" },
  completed: { bg: "bg-gray-100 text-gray-600", label: "Tamamlandı", icon: "check_circle" },
  cancelled: { bg: "bg-red-100 text-red-500", label: "İptal", icon: "cancel" },
};

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-4 h-4 rounded ${color} border border-black/10`} />
      <span className="text-xs text-on-surface-variant">{label}</span>
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────

export default function ManagerDashboard() {
  const router = useRouter();
  const { logout, getCurrentUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [spotFloor, setSpotFloor] = useState("Zemin");
  const [resFilter, setResFilter] = useState<Reservation["status"] | "all">("all");

  // Stable dummy data (generated once)
  const spots = useMemo(() => generateSpots(), []);
  const reservations = useMemo(() => generateReservations(), []);
  const revenueData = useMemo(() => generateRevenue(), []);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) { router.replace("/login?role=manager"); return; }
    if (currentUser.role !== "OPERATOR") { router.replace("/"); return; }
    setUser(currentUser);
  }, [getCurrentUser, router]);

  if (!user) return null;

  // Derived stats
  const totalSpots = spots.length;
  const emptySpots = spots.filter((s) => s.status === "empty").length;
  const reservedSpots = spots.filter((s) => s.status === "reserved").length;
  const occupiedSpots = spots.filter((s) => s.status === "occupied").length;
  const occupancyPct = Math.round((occupiedSpots / totalSpots) * 100);
  const todayIncome = revenueData[revenueData.length - 1]?.income ?? 0;
  const weekIncome = revenueData.reduce((s, d) => s + d.income, 0);
  const activeRes = reservations.filter((r) => r.status === "active").length;
  const filteredRes = resFilter === "all" ? reservations : reservations.filter((r) => r.status === resFilter);

  const TABS: { key: TabKey; label: string; icon: string }[] = [
    { key: "overview", label: "Genel Bakış", icon: "dashboard" },
    { key: "spots", label: "Park Yerleri", icon: "grid_view" },
    { key: "reservations", label: "Rezervasyonlar", icon: "bookmark" },
    { key: "revenue", label: "Gelir Raporu", icon: "payments" },
  ];

  return (
    <>
      <Header />
      <main className="flex-grow portal-gradient pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          {/* ── Welcome Banner ─────────────────────────────────────── */}
          <div className="relative overflow-hidden bg-gradient-to-br from-secondary-container via-secondary to-secondary-container rounded-2xl p-6 md:p-8 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-black/5" />
            <div className="absolute -right-6 -bottom-16 w-48 h-48 rounded-full bg-black/5" />

            <div className="relative z-10">
              <p className="text-on-secondary-fixed-variant text-xs font-label uppercase tracking-widest mb-1">Yönetici Paneli</p>
              <h1 className="text-2xl md:text-3xl font-extrabold font-headline text-on-secondary-fixed">
                Hoş Geldiniz, {user.name || user.email}! 🏢
              </h1>
              <p className="text-on-secondary-fixed-variant text-sm mt-1">{user.email}</p>
              <div className="mt-3 inline-flex items-center gap-2 bg-black/10 rounded-xl px-3 py-2 border border-black/10">
                <MaterialIcon name="apartment" className="text-xl text-on-secondary-fixed" />
                <span className="font-bold text-sm text-on-secondary-fixed">Taksim Merkez Otopark</span>
                <span className="text-on-secondary-fixed-variant text-xs">· 80 Park Yeri</span>
              </div>
            </div>

            <div className="relative z-10 flex gap-3 flex-wrap">
              <div className="bg-black/10 border border-black/10 rounded-xl px-4 py-3 text-center min-w-[90px]">
                <p className="text-2xl font-extrabold font-headline text-on-secondary-fixed">{occupancyPct}%</p>
                <p className="text-xs text-on-secondary-fixed-variant mt-0.5">Doluluk</p>
              </div>
              <div className="bg-black/10 border border-black/10 rounded-xl px-4 py-3 text-center min-w-[90px]">
                <p className="text-2xl font-extrabold font-headline text-on-secondary-fixed">₺{todayIncome.toLocaleString("tr-TR")}</p>
                <p className="text-xs text-on-secondary-fixed-variant mt-0.5">Bugün</p>
              </div>
              <div className="bg-black/10 border border-black/10 rounded-xl px-4 py-3 text-center min-w-[90px]">
                <p className="text-2xl font-extrabold font-headline text-on-secondary-fixed">{activeRes}</p>
                <p className="text-xs text-on-secondary-fixed-variant mt-0.5">Aktif Rez.</p>
              </div>
            </div>
          </div>

          {/* ── Tab Navigation ─────────────────────────────────────── */}
          <div className="flex gap-1 bg-white rounded-xl p-1 border border-outline-variant/20 shadow-sm mb-6 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium font-headline transition-all duration-200 ${
                  activeTab === tab.key
                    ? "bg-primary text-white shadow-sm"
                    : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                }`}
              >
                <MaterialIcon name={tab.icon} className="text-base" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── TAB: Overview ─────────────────────────────────────── */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon="local_parking" label="Toplam Park Yeri" value={totalSpots} accent="bg-primary" />
                <StatCard icon="check_circle" label="Boş Alan" value={emptySpots} sub={`%${Math.round((emptySpots / totalSpots) * 100)} müsait`} accent="bg-green-500" />
                <StatCard icon="event_available" label="Rezerve" value={reservedSpots} accent="bg-yellow-500" />
                <StatCard icon="block" label="Dolu" value={occupiedSpots} sub={`%${occupancyPct} doluluk`} accent="bg-red-500" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Donut + Stats */}
                <div className="bg-white rounded-2xl border border-outline-variant/20 p-6 shadow-sm">
                  <h3 className="font-headline font-bold text-on-surface text-sm mb-4 flex items-center gap-2">
                    <MaterialIcon name="pie_chart" className="text-primary text-base" />
                    Doluluk Durumu
                  </h3>
                  <OccupancyDonut empty={emptySpots} reserved={reservedSpots} occupied={occupiedSpots} total={totalSpots} />
                  <div className="flex justify-center gap-4 mt-4">
                    <LegendItem color="bg-green-500" label={`Boş (${emptySpots})`} />
                    <LegendItem color="bg-yellow-400" label={`Rezerve (${reservedSpots})`} />
                    <LegendItem color="bg-red-500" label={`Dolu (${occupiedSpots})`} />
                  </div>
                </div>

                {/* Weekly Revenue Chart */}
                <div className="bg-white rounded-2xl border border-outline-variant/20 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-headline font-bold text-on-surface text-sm flex items-center gap-2">
                      <MaterialIcon name="bar_chart" className="text-primary text-base" />
                      Haftalık Gelir
                    </h3>
                    <span className="text-xs text-on-surface-variant bg-surface-container px-2 py-1 rounded-lg">
                      ₺{weekIncome.toLocaleString("tr-TR")}
                    </span>
                  </div>
                  <RevenueBarChart data={revenueData} />
                </div>

                {/* Activity Log */}
                <div className="bg-white rounded-2xl border border-outline-variant/20 p-6 shadow-sm">
                  <h3 className="font-headline font-bold text-on-surface text-sm mb-4 flex items-center gap-2">
                    <MaterialIcon name="history" className="text-primary text-base" />
                    Son Aktiviteler
                  </h3>
                  <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                    {ACTIVITY_LOG.map((log) => (
                      <div key={log.id} className="flex items-start gap-3 group">
                        <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                          <MaterialIcon name={log.icon} className={`text-sm ${log.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-on-surface leading-relaxed">{log.message}</p>
                          <p className="text-[10px] text-outline mt-0.5">{log.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floor-wise quick breakdown */}
              <div className="bg-white rounded-2xl border border-outline-variant/20 p-6 shadow-sm">
                <h3 className="font-headline font-bold text-on-surface text-sm mb-4 flex items-center gap-2">
                  <MaterialIcon name="layers" className="text-primary text-base" />
                  Kat Bazlı Doluluk
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {FLOORS.map((floor) => {
                    const fs = spots.filter((s) => s.floor === floor);
                    const fe = fs.filter((s) => s.status === "empty").length;
                    const fo = fs.filter((s) => s.status === "occupied").length;
                    const fr = fs.filter((s) => s.status === "reserved").length;
                    const pct = Math.round((fo / fs.length) * 100);
                    return (
                      <div key={floor} className="border border-outline-variant/20 rounded-xl p-4 hover:shadow-sm transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-headline font-bold text-sm text-on-surface">{floor}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${pct > 70 ? "bg-red-100 text-red-600" : pct > 40 ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-600"}`}>
                            %{pct}
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden flex mb-2">
                          <div className="bg-red-500 h-full" style={{ width: `${(fo / fs.length) * 100}%` }} />
                          <div className="bg-yellow-400 h-full" style={{ width: `${(fr / fs.length) * 100}%` }} />
                          <div className="bg-green-500 h-full" style={{ width: `${(fe / fs.length) * 100}%` }} />
                        </div>
                        <div className="flex justify-between text-[10px] text-on-surface-variant">
                          <span className="text-green-600">{fe} boş</span>
                          <span className="text-yellow-600">{fr} rez</span>
                          <span className="text-red-500">{fo} dolu</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: Spots ────────────────────────────────────────── */}
          {activeTab === "spots" && (
            <div className="space-y-6">
              {/* Legend + Floor selector */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white rounded-2xl border border-outline-variant/20 p-4 shadow-sm">
                <div className="flex items-center gap-4 flex-wrap">
                  <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Açıklama:</p>
                  <LegendItem color="bg-green-100 border-green-400" label="Boş" />
                  <LegendItem color="bg-yellow-100 border-yellow-400" label="Rezerve" />
                  <LegendItem color="bg-red-100 border-red-400" label="Dolu" />
                </div>
                <div className="flex gap-1 bg-surface-container rounded-lg p-1">
                  {FLOORS.map((f) => (
                    <button
                      key={f}
                      onClick={() => setSpotFloor(f)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                        spotFloor === f
                          ? "bg-primary text-white shadow-sm"
                          : "text-on-surface-variant hover:text-on-surface hover:bg-white"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid */}
              <div className="bg-white rounded-2xl border border-outline-variant/20 p-6 shadow-sm">
                <ParkingFloorGrid spots={spots} floor={spotFloor} />
              </div>

              {/* Occupied vehicles table */}
              <div className="bg-white rounded-2xl border border-outline-variant/20 p-6 shadow-sm">
                <h3 className="font-headline font-bold text-on-surface text-sm mb-4 flex items-center gap-2">
                  <MaterialIcon name="directions_car" className="text-primary text-base" />
                  {spotFloor} — Mevcut Araçlar
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-outline-variant/20 text-left">
                        <th className="pb-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Park Yeri</th>
                        <th className="pb-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Plaka</th>
                        <th className="pb-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Araç</th>
                        <th className="pb-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Giriş</th>
                        <th className="pb-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Durum</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10">
                      {spots
                        .filter((s) => s.floor === spotFloor && s.status === "occupied")
                        .map((s) => (
                          <tr key={s.id} className="hover:bg-surface-container/50 transition-colors">
                            <td className="py-3 font-mono font-bold text-primary text-xs">{s.number}</td>
                            <td className="py-3 font-mono font-bold text-on-surface text-xs tracking-wider">{s.vehiclePlate}</td>
                            <td className="py-3 text-on-surface-variant text-xs">{s.vehicleBrand}</td>
                            <td className="py-3 text-on-surface-variant text-xs">{s.since}</td>
                            <td className="py-3"><span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">Dolu</span></td>
                          </tr>
                        ))}
                      {spots
                        .filter((s) => s.floor === spotFloor && s.status === "reserved")
                        .map((s) => (
                          <tr key={s.id} className="hover:bg-surface-container/50 transition-colors">
                            <td className="py-3 font-mono font-bold text-primary text-xs">{s.number}</td>
                            <td className="py-3 text-on-surface-variant text-xs">—</td>
                            <td className="py-3 text-on-surface-variant text-xs">{s.reservedBy}</td>
                            <td className="py-3 text-on-surface-variant text-xs">{s.reservedUntil}</td>
                            <td className="py-3"><span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Rezerve</span></td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: Reservations ─────────────────────────────────── */}
          {activeTab === "reservations" && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="flex items-center gap-2 flex-wrap bg-white rounded-xl p-3 border border-outline-variant/20 shadow-sm">
                {(["all", "active", "upcoming", "completed", "cancelled"] as const).map((f) => {
                  const labels: Record<string, string> = { all: "Tümü", active: "Aktif", upcoming: "Yaklaşan", completed: "Tamamlanan", cancelled: "İptal" };
                  const counts: Record<string, number> = {
                    all: reservations.length,
                    active: reservations.filter((r) => r.status === "active").length,
                    upcoming: reservations.filter((r) => r.status === "upcoming").length,
                    completed: reservations.filter((r) => r.status === "completed").length,
                    cancelled: reservations.filter((r) => r.status === "cancelled").length,
                  };
                  return (
                    <button
                      key={f}
                      onClick={() => setResFilter(f)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                        resFilter === f
                          ? "bg-primary text-white shadow-sm"
                          : "text-on-surface-variant hover:bg-surface-container"
                      }`}
                    >
                      {labels[f]}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        resFilter === f ? "bg-white/20 text-white" : "bg-surface-container text-on-surface-variant"
                      }`}>
                        {counts[f]}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Reservation cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredRes.map((res) => {
                  const st = RES_STATUS_MAP[res.status];
                  return (
                    <div key={res.id} className="bg-white rounded-2xl border border-outline-variant/20 p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center">
                            <MaterialIcon name="person" className="text-lg text-primary" />
                          </div>
                          <div>
                            <p className="font-headline font-bold text-sm text-on-surface">{res.customerName}</p>
                            <p className="text-[10px] text-on-surface-variant">{res.phone}</p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1 ${st.bg} text-xs font-medium px-2 py-1 rounded-full`}>
                          <MaterialIcon name={st.icon} className="text-xs" />
                          {st.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                        <div className="bg-surface-container rounded-lg p-2">
                          <p className="text-[10px] text-on-surface-variant">Plaka</p>
                          <p className="font-mono font-bold text-on-surface tracking-wider">{res.vehiclePlate}</p>
                        </div>
                        <div className="bg-surface-container rounded-lg p-2">
                          <p className="text-[10px] text-on-surface-variant">Park Yeri</p>
                          <p className="font-mono font-bold text-primary">{res.spotNumber}</p>
                        </div>
                        <div className="bg-surface-container rounded-lg p-2">
                          <p className="text-[10px] text-on-surface-variant">Giriş</p>
                          <p className="font-medium text-on-surface">{res.startTime}</p>
                        </div>
                        <div className="bg-surface-container rounded-lg p-2">
                          <p className="text-[10px] text-on-surface-variant">Çıkış</p>
                          <p className="font-medium text-on-surface">{res.endTime}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-outline-variant/10 pt-3">
                        <span className="text-on-surface-variant text-xs">{res.vehicleBrand}</span>
                        <span className="font-headline font-extrabold text-primary">₺{res.amount}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── TAB: Revenue ──────────────────────────────────────── */}
          {activeTab === "revenue" && (
            <div className="space-y-6">
              {/* Revenue Summary */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon="today" label="Bugünkü Gelir" value={`₺${todayIncome.toLocaleString("tr-TR")}`} accent="bg-primary" sub="↑ %12 dünden fazla" />
                <StatCard icon="date_range" label="Haftalık Gelir" value={`₺${weekIncome.toLocaleString("tr-TR")}`} accent="bg-secondary" />
                <StatCard icon="calendar_month" label="Aylık Gelir (Tahmini)" value={`₺${(weekIncome * 4.3).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`} accent="bg-green-500" />
                <StatCard icon="receipt_long" label="Toplam Rezervasyon" value={reservations.length} sub="Bu hafta" accent="bg-purple-500" />
              </div>

              {/* Big Chart */}
              <div className="bg-white rounded-2xl border border-outline-variant/20 p-6 shadow-sm">
                <h3 className="font-headline font-bold text-on-surface text-sm mb-2 flex items-center gap-2">
                  <MaterialIcon name="show_chart" className="text-primary text-base" />
                  Haftalık Gelir Grafiği
                </h3>
                <p className="text-xs text-on-surface-variant mb-4">Son 7 gün bazında günlük gelir dağılımı</p>
                <RevenueBarChart data={revenueData} />
              </div>

              {/* Daily breakdown table */}
              <div className="bg-white rounded-2xl border border-outline-variant/20 p-6 shadow-sm">
                <h3 className="font-headline font-bold text-on-surface text-sm mb-4 flex items-center gap-2">
                  <MaterialIcon name="table_chart" className="text-primary text-base" />
                  Günlük Detay
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-outline-variant/20 text-left">
                        <th className="pb-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Gün</th>
                        <th className="pb-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Tarih</th>
                        <th className="pb-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Gelir</th>
                        <th className="pb-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Rezervasyon</th>
                        <th className="pb-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Ort. / Rez.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10">
                      {revenueData.map((d) => (
                        <tr key={d.date} className="hover:bg-surface-container/50 transition-colors">
                          <td className="py-3 font-medium text-on-surface">{d.dayLabel}</td>
                          <td className="py-3 text-on-surface-variant">{d.date}</td>
                          <td className="py-3 font-headline font-bold text-primary">₺{d.income.toLocaleString("tr-TR")}</td>
                          <td className="py-3 text-on-surface-variant">{d.reservations}</td>
                          <td className="py-3 text-on-surface-variant">₺{Math.round(d.income / d.reservations)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-primary/20 bg-primary/5">
                        <td className="py-3 font-headline font-bold text-primary" colSpan={2}>Toplam</td>
                        <td className="py-3 font-headline font-extrabold text-primary">₺{weekIncome.toLocaleString("tr-TR")}</td>
                        <td className="py-3 font-bold text-on-surface">{revenueData.reduce((s, d) => s + d.reservations, 0)}</td>
                        <td className="py-3 text-on-surface-variant">₺{Math.round(weekIncome / revenueData.reduce((s, d) => s + d.reservations, 0))}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Logout ────────────────────────────────────────────── */}
          <div className="flex justify-end mt-6">
            <button
              onClick={logout}
              className="flex items-center gap-2 text-sm text-outline hover:text-error transition-colors font-medium"
            >
              <MaterialIcon name="logout" className="text-xl" />
              Çıkış Yap
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
