"use client";

import { useState, useEffect, useCallback } from "react";
import { vehicleApi, parkingLotApi, reservationApi } from "@/lib/api";
import { Vehicle, ParkingLot, CreateReservationPayload } from "@/types";
import MaterialIcon from "@/components/ui/MaterialIcon";

interface ReservationFormProps {
  onSuccess?: (reservationId: number) => void;
  onError?: (error: string) => void;
}

const DURATION_OPTIONS = [1, 2, 3, 4, 6, 8, 12, 24];

export default function ReservationForm({ onSuccess, onError }: ReservationFormProps) {
  // State
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<number | "">("");
  const [selectedParkingLot, setSelectedParkingLot] = useState<number | "">("");
  const [startTime, setStartTime] = useState<string>("");
  const [plannedDuration, setPlannedDuration] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch vehicles on mount
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        console.log("Fetching vehicles...");
        const { data } = await vehicleApi.getUserVehicles();
        console.log("Vehicles response:", data);
        if (data.success && data.data) {
          setVehicles(data.data as Vehicle[]);
          console.log("Vehicles loaded:", data.data);
        } else {
          console.warn("No vehicle data in response");
          // Fallback: mock vehicle for testing
          const mockVehicle: Vehicle = {
            id: 1,
            plate: "34ABC1234",
            type: "CAR",
            brand: "Toyota",
            model: "Corolla",
            ownerId: 1,
          };
          setVehicles([mockVehicle]);
          console.log("Using mock vehicle for testing");
        }
      } catch (err: any) {
        console.error("Failed to fetch vehicles:", err);
        console.error("Error details:", {
          status: err.response?.status,
          message: err.message,
          url: err.config?.url,
        });
        // Fallback: mock vehicle for testing
        const mockVehicle: Vehicle = {
          id: 1,
          plate: "34ABC1234",
          type: "CAR",
          brand: "Toyota",
          model: "Corolla",
          ownerId: 1,
        };
        setVehicles([mockVehicle]);
        console.log("Using mock vehicle due to error");
      }
    };
    fetchVehicles();
  }, []);

  // Fetch parking lots on mount (or use nearby if geolocation available)
  useEffect(() => {
    const fetchParkingLots = async () => {
      try {
        // Try to get user's location for nearby parking lots
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              console.log("User location:", latitude, longitude);
              try {
                const { data } = await parkingLotApi.findNearby(latitude, longitude, 10);
                console.log("Nearby parking lots response:", data);
                if (data.success && data.data && data.data.length > 0) {
                  setParkingLots(data.data as ParkingLot[]);
                  console.log("Parking lots loaded:", data.data);
                } else {
                  console.warn("No parking lots found, using mock");
                  fetchDefaultParkingLots();
                }
              } catch (err) {
                console.error("Failed to fetch nearby parking lots:", err);
                fetchDefaultParkingLots();
              }
            },
            (error) => {
              console.warn("Geolocation error:", error);
              fetchDefaultParkingLots();
            }
          );
        } else {
          fetchDefaultParkingLots();
        }
      } catch (err) {
        console.error("Failed to fetch parking lots:", err);
      }
    };

    const fetchDefaultParkingLots = async () => {
      try {
        console.log("Using mock parking lots for testing");
        const mockLots: ParkingLot[] = [
          {
            id: 1,
            name: "Merkez Otopark",
            latitude: 40.7128,
            longitude: 29.0131,
            address: "İstanbul, Türkiye",
            workingHours: "24/7",
            capacity: 100,
            currentOccupancy: 30, // 70 available spots
            hourlyRate: 15,
          },
          {
            id: 2,
            name: "Sahil Otopark",
            latitude: 40.7258,
            longitude: 29.0331,
            address: "Sahil Caddesi, İstanbul",
            workingHours: "06:00 - 23:00",
            capacity: 80,
            currentOccupancy: 25, // 55 available spots
            hourlyRate: 12,
          },
          {
            id: 3,
            name: "Acibadem Otopark",
            latitude: 40.7558,
            longitude: 29.0431,
            address: "Acıbadem Mahallesi, İstanbul",
            workingHours: "24/7",
            capacity: 120,
            currentOccupancy: 40, // 80 available spots
            hourlyRate: 18,
          },
        ];
        setParkingLots(mockLots);
      } catch (err) {
        console.error("Failed to set mock parking lots:", err);
      }
    };

    fetchParkingLots();
  }, []);

  // Calculate price based on selected parking lot and duration
  const calculatePrice = useCallback((): number => {
    if (!selectedParkingLot || !parkingLots.length) return 0;
    const lot = parkingLots.find((p) => p.id === selectedParkingLot);
    if (!lot) return 0;
    return lot.hourlyRate * plannedDuration;
  }, [selectedParkingLot, plannedDuration, parkingLots]);

  const estimatedPrice = calculatePrice();

  // Calculate planned departure time
  const calculatePlannedDeparture = (): string => {
    if (!startTime) return "";
    const start = new Date(startTime);
    const departure = new Date(start.getTime() + plannedDuration * 60 * 60 * 1000);
    return departure.toLocaleString("tr-TR");
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation
    if (!selectedVehicle || !selectedParkingLot || !startTime || !plannedDuration) {
      setError("Lütfen tüm alanları doldurunuz.");
      return;
    }

    setLoading(true);

    try {
      const payload: CreateReservationPayload = {
        vehicleId: typeof selectedVehicle === "number" ? selectedVehicle : parseInt(String(selectedVehicle)),
        parkingLotId: typeof selectedParkingLot === "number" ? selectedParkingLot : parseInt(String(selectedParkingLot)),
        startTime: new Date(startTime).toISOString(),
        plannedDuration,
      };

      const { data } = await reservationApi.createReservation(payload);

      if (data.success && data.data) {
        setSuccess(true);
        setSelectedVehicle("");
        setSelectedParkingLot("");
        setStartTime("");
        setPlannedDuration(1);
        onSuccess?.(data.data.id);
      } else {
        setError(data.message || "Rezervasyon oluşturulamadı.");
        onError?.(data.message || "Hata oluştu.");
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || "Bir hata oluştu.";
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const selectedLot = parkingLots.find((p) => p.id === selectedParkingLot);
  const selectedVehicleObj = vehicles.find((v) => v.id === selectedVehicle);

  return (
    <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8 border border-outline-variant/30">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-primary-container rounded-full flex items-center justify-center mx-auto">
            <MaterialIcon name="local_parking" className="text-3xl text-white" />
          </div>
          <h1 className="text-3xl font-extrabold font-headline text-primary">
            Otopark Rezervasyonu
          </h1>
          <p className="text-sm text-on-surface-variant">
            Aracınız için konforlu bir park yeri rezerve edin
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-error-container text-on-error-container text-sm rounded-lg px-4 py-3 flex items-center gap-2">
            <MaterialIcon name="error" className="text-base" />
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-success/10 border border-success text-success text-sm rounded-lg px-4 py-3 flex items-center gap-2">
            <MaterialIcon name="check_circle" className="text-base" />
            Rezervasyon başarıyla oluşturuldu!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Vehicle Selection */}
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-2">
              Araç Seçimi <span className="text-error">*</span>
            </label>
            <div className="relative">
              <MaterialIcon name="directions_car" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xl" />
              <select
                required
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value ? parseInt(e.target.value) : "")}
                className="w-full pl-10 pr-4 py-3 border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition text-sm appearance-none bg-white"
              >
                <option value="">Araç seçiniz...</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.brand} {vehicle.model} ({vehicle.plate})
                  </option>
                ))}
              </select>
              <MaterialIcon name="expand_more" className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
            </div>
            {selectedVehicleObj && (
              <div className="mt-2 p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-center gap-3">
                <MaterialIcon name="check_circle" className="text-primary text-lg" />
                <div className="text-sm">
                  <p className="font-semibold text-on-surface">{selectedVehicleObj.brand} {selectedVehicleObj.model}</p>
                  <p className="text-xs text-on-surface-variant">Plaka: {selectedVehicleObj.plate}</p>
                </div>
              </div>
            )}
          </div>

          {/* Parking Lot Selection */}
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-2">
              Otopark Seçimi <span className="text-error">*</span>
            </label>
            <div className="relative">
              <MaterialIcon name="location_on" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xl" />
              <select
                required
                value={selectedParkingLot}
                onChange={(e) => setSelectedParkingLot(e.target.value ? parseInt(e.target.value) : "")}
                className="w-full pl-10 pr-4 py-3 border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition text-sm appearance-none bg-white"
              >
                <option value="">Otopark seçiniz...</option>
                {parkingLots.map((lot) => (
                  <option key={lot.id} value={lot.id}>
                    {lot.name} - ₺{lot.hourlyRate}/saat - {lot.currentOccupancy}/{lot.capacity} slot
                  </option>
                ))}
              </select>
              <MaterialIcon name="expand_more" className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
            </div>
            {selectedLot && (
              <div className="mt-2 p-3 bg-secondary/5 border border-secondary/20 rounded-lg">
                <p className="font-semibold text-on-surface text-sm mb-2">{selectedLot.name}</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-on-surface-variant mb-1">Adres</p>
                    <p className="text-on-surface">{selectedLot.address}</p>
                  </div>
                  <div>
                    <p className="text-on-surface-variant mb-1">Kapasite</p>
                    <p className="font-semibold text-on-surface">
                      {selectedLot.currentOccupancy}/{selectedLot.capacity}
                    </p>
                  </div>
                  <div>
                    <p className="text-on-surface-variant mb-1">Çalışma Saatleri</p>
                    <p className="text-on-surface">{selectedLot.workingHours}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Start Time */}
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-2">
              Başlangıç Zamanı <span className="text-error">*</span>
            </label>
            <div className="relative">
              <MaterialIcon name="schedule" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xl" />
              <input
                type="datetime-local"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition text-sm"
              />
            </div>
            <p className="text-xs text-on-surface-variant mt-1">İleri bir tarih ve saat seçiniz</p>
          </div>

          {/* Planned Duration */}
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-2">
              Planlanan Süre <span className="text-error">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {DURATION_OPTIONS.map((hours) => (
                <button
                  key={hours}
                  type="button"
                  onClick={() => setPlannedDuration(hours)}
                  className={`py-2 px-3 rounded-lg font-semibold text-sm transition-all ${
                    plannedDuration === hours
                      ? "bg-primary text-white ring-2 ring-primary/40"
                      : "bg-outline-variant/20 text-on-surface hover:bg-outline-variant/40"
                  }`}
                >
                  {hours}h
                </button>
              ))}
            </div>
            <div className="relative">
              <MaterialIcon name="timer" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xl" />
              <input
                type="number"
                min={1}
                max={720}
                value={plannedDuration}
                onChange={(e) => setPlannedDuration(parseInt(e.target.value) || 1)}
                className="w-full pl-10 pr-4 py-3 border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition text-sm"
                placeholder="Saat olarak girin (1-720)"
              />
            </div>
          </div>

          {/* Price Preview & Departure Info */}
          {startTime && plannedDuration && selectedLot && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-on-surface-variant font-label uppercase tracking-wider mb-1">
                    Giriş Zamanı
                  </p>
                  <p className="font-semibold text-on-surface">
                    {new Date(startTime).toLocaleString("tr-TR")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant font-label uppercase tracking-wider mb-1">
                    Çıkış Zamanı
                  </p>
                  <p className="font-semibold text-on-surface">
                    {calculatePlannedDeparture()}
                  </p>
                </div>
              </div>
              <div className="border-t border-primary/20 pt-3">
                <p className="text-xs text-on-surface-variant font-label uppercase tracking-wider mb-2">
                  Fiyat Hesaplaması
                </p>
                <div className="space-y-1 mb-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-on-surface-variant">Saatlik Ücret:</span>
                    <span className="font-semibold">₺{selectedLot.hourlyRate.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-on-surface-variant">Planlanan Süre:</span>
                    <span className="font-semibold">{plannedDuration} saat</span>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-2 border border-primary/30">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-on-surface">Tahmini Ücret:</span>
                    <span className="text-2xl font-extrabold text-primary">
                      ₺{estimatedPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-error-variant bg-error/5 rounded p-2">
                💡 Not: Fazla kalış durumunda cezai ücret ({"{"}1.5x fiyat{"}"}) uygulanacaktır.
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !selectedVehicle || !selectedParkingLot || !startTime || plannedDuration <= 0}
            className="w-full bg-primary text-white py-3 rounded-xl font-semibold font-headline tracking-wide hover:bg-primary/90 active:scale-95 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Rezervasyon yapılıyor...
              </>
            ) : (
              <>
                <MaterialIcon name="done_all" className="text-xl" />
                Rezervasyon Yap
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
