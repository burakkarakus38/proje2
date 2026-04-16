"use client";

import { useState, useEffect, useMemo } from "react";
import { vehicleApi, parkingLotApi, reservationApi } from "@/lib/api";
import { Vehicle, ParkingLot, CreateReservationPayload } from "@/types";
import MaterialIcon from "@/components/ui/MaterialIcon";

interface ReservationFormProps {
  onSuccess?: (reservationId: number) => void;
  onError?: (error: string) => void;
  initialParkingLotId?: number;
}

const DURATION_OPTIONS = [1, 2, 3, 4, 6, 8, 12, 24];

export default function ReservationForm({ onSuccess, onError, initialParkingLotId }: ReservationFormProps) {
  // 1. Initial State (Now + 1 hour for default start)
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<number | "">("");
  const [selectedParkingLot, setSelectedParkingLot] = useState<number | "">(initialParkingLotId || "");
  
  // Format current time for input: YYYY-MM-DDTHH:mm
  const getNowFormatted = (plusHours = 0) => {
    const d = new Date();
    d.setHours(d.getHours() + plusHours);
    d.setMinutes(0); // Round down to hour for cleaner UI
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [startTime, setStartTime] = useState<string>(getNowFormatted(1));
  const [endTime, setEndTime] = useState<string>(getNowFormatted(3));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 2. Derive Duration
  const plannedDuration = useMemo(() => {
    if (!startTime || !endTime) return 0;
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const diff = end - start;
    if (diff <= 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60));
  }, [startTime, endTime]);

  // 3. Handlers
  const handleQuickDuration = (hours: number) => {
    if (!startTime) return;
    const start = new Date(startTime);
    const newEnd = new Date(start.getTime() + hours * 60 * 60 * 1000);
    
    const year = newEnd.getFullYear();
    const month = String(newEnd.getMonth() + 1).padStart(2, "0");
    const day = String(newEnd.getDate()).padStart(2, "0");
    const hoursStr = String(newEnd.getHours()).padStart(2, "0");
    const minutes = String(newEnd.getMinutes()).padStart(2, "0");
    
    setEndTime(`${year}-${month}-${day}T${hoursStr}:${minutes}`);
  };

  const handleStartTimeChange = (val: string) => {
    setStartTime(val);
    const start = new Date(val).getTime();
    const end = new Date(endTime).getTime();
    if (end <= start) {
      // Auto move end time to start + current duration or +2h
      const newDur = plannedDuration > 0 ? plannedDuration : 2;
      const newEnd = new Date(start + newDur * 60 * 60 * 1000);
      const year = newEnd.getFullYear();
      const month = String(newEnd.getMonth() + 1).padStart(2, "0");
      const day = String(newEnd.getDate()).padStart(2, "0");
      const hStr = String(newEnd.getHours()).padStart(2, "0");
      const mStr = String(newEnd.getMinutes()).padStart(2, "0");
      setEndTime(`${year}-${month}-${day}T${hStr}:${mStr}`);
    }
  };

  // 4. Data Loading
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const { data } = await vehicleApi.getUserVehicles();
        if (data.success && data.data) setVehicles(data.data as Vehicle[]);
      } catch (err) {}
    };
    const fetchLots = async () => {
      try {
        const { data } = await parkingLotApi.getAll();
        if (data.success && data.data) setParkingLots(data.data as ParkingLot[]);
        else {
          setParkingLots([{ id: 1, name: "Merkez Otopark", address: "Beyoğlu, İst", hourlyRate: 40, capacity: 100, currentOccupancy: 20, latitude: 0, longitude: 0, workingHours: "24/7" }]);
        }
      } catch (err) {}
    };
    fetchVehicles();
    fetchLots();
  }, []);

  const selectedLot = parkingLots.find((p) => p.id === selectedParkingLot);
  const estimatedPrice = selectedLot ? selectedLot.hourlyRate * plannedDuration : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (plannedDuration <= 0) {
      setError("Bitiş zamanı başlangıçtan sonra olmalıdır.");
      return;
    }

    setLoading(true);
    try {
      const payload: CreateReservationPayload = {
        vehicleId: Number(selectedVehicle),
        parkingLotId: Number(selectedParkingLot),
        startTime: new Date(startTime).toISOString(),
        plannedDuration,
      };

        const { data } = await reservationApi.createReservation(payload);
        if (data?.success && data?.data) {
          setSuccess(true);
          onSuccess?.(data.data.id);
        } else setError(data?.message || "Hata oluştu.");
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-8 border border-slate-200 text-slate-800 animate-in fade-in zoom-in duration-300">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-black font-headline text-slate-900 tracking-tight">Yeni Rezervasyon</h2>
            <p className="text-sm text-slate-500 font-medium">Otopark yerinizi dakikalar içinde rezerve edin.</p>
          </div>
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <MaterialIcon name="local_parking" className="text-3xl" />
          </div>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-semibold border border-red-100 flex items-center gap-3 animate-in slide-in-from-top-2"><MaterialIcon name="warning" />{error}</div>}
        {success && <div className="bg-green-50 text-green-600 p-4 rounded-2xl text-sm font-semibold border border-green-100 flex items-center gap-3 animate-in slide-in-from-top-2"><MaterialIcon name="verified" />Rezervasyon başarılır!</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Main selections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1">ARACINIZ</label>
              <div className="relative group">
                <MaterialIcon name="directions_car" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <select required value={selectedVehicle} onChange={(e) => setSelectedVehicle(e.target.value ? Number(e.target.value) : "")} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none font-bold text-slate-700">
                  <option value="">Araç Seçin</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} - {v.brand}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1">OTOPARK</label>
              <div className="relative group">
                <MaterialIcon name="map" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <select required value={selectedParkingLot} onChange={(e) => setSelectedParkingLot(e.target.value ? Number(e.target.value) : "")} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none font-bold text-slate-700">
                  <option value="">Otopark Seçin</option>
                  {parkingLots.map(l => <option key={l.id} value={l.id}>{l.name} (₺{l.hourlyRate}/sa)</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-100 w-full" />

          {/* Time Management */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1">GİRİŞ TARİHİ & SAATİ</label>
                <input type="datetime-local" required value={startTime} onChange={(e) => handleStartTimeChange(e.target.value)} className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-slate-700" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1">ÇIKIŞ TARİHİ & SAATİ</label>
                <input type="datetime-local" required value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-slate-700" />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1">HIZLI SÜRE EKLE</label>
              <div className="flex flex-wrap gap-2">
                {DURATION_OPTIONS.map(h => (
                  <button key={h} type="button" onClick={() => handleQuickDuration(h)} className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all">
                    +{h} Saat
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Summary Card */}
          {selectedLot && plannedDuration > 0 && (
            <div className="bg-slate-900 rounded-3xl p-6 text-white overflow-hidden relative group">
              <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <MaterialIcon name="receipt_long" className="text-8xl" />
              </div>
              <div className="relative z-10 space-y-4">
                <div className="flex justify-between items-end border-b border-white/10 pb-4">
                  <div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Hesaplanan Süre</p>
                    <p className="text-2xl font-black">{plannedDuration} Saat</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Saatlik Ücret</p>
                    <p className="text-xl font-bold">₺{selectedLot.hourlyRate}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm font-bold text-blue-400 uppercase tracking-tighter">İşlem Özeti</p>
                  <div className="text-right">
                    <p className="text-xs text-white/50 mb-1">Toplam Tutar</p>
                    <p className="text-4xl font-black text-white">₺{estimatedPrice.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <button type="submit" disabled={loading || plannedDuration <= 0} className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black text-lg shadow-xl shadow-blue-600/20 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? "İşlem Yapılıyor..." : "Rezervasyonu Tamamla"}
          </button>
        </form>
      </div>
    </div>
  );
}
