// ── API Response ──────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  message: string;
  timestamp: string;
}

// ── User & Auth ───────────────────────────────────────────────────
export type UserRole = "USER" | "OPERATOR" | "ADMIN";

export interface User {
  id: number;
  email: string;
  gsm: string;
  name: string | null;
  role: UserRole;
  isVerified: boolean;
  createdAt: string;
  // Araç bilgileri
  vehiclePlate?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RegisterResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// ── Login / Register Payloads ─────────────────────────────────────
export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  gsm: string;
  password: string;
  role: 'USER' | 'OPERATOR' | 'ADMIN';
  // Araç bilgileri (şoför için gerekli)
  vehiclePlate?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
}

export interface OtpPayload {
  gsm: string;
  otp: string;
}

// ── Role Card ─────────────────────────────────────────────────────
export type RoleColorScheme = "primary" | "secondary" | "dark";

export interface RoleCardProps {
  title: string;
  subtitle: string;
  icon: string;
  href: string;
  colorScheme: RoleColorScheme;
}

// ── Vehicle ────────────────────────────────────────────────────────
export interface Vehicle {
  id: number;
  plate: string;
  type: "CAR" | "SUV" | "MOTORCYCLE" | "TRUCK";
  brand: string;
  model: string;
  ownerId: number;
  createdAt?: string;
  updatedAt?: string;
}

// ── Parking Lot ────────────────────────────────────────────────────
export interface ParkingLot {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  workingHours: string;
  capacity: number;
  currentOccupancy: number;
  hourlyRate: number;
  availableCapacity?: number;
  occupancyStatus?: "GREEN" | "YELLOW" | "RED";
  providerId?: number;
  createdAt?: string;
  updatedAt?: string;
}

// ── Reservation ────────────────────────────────────────────────────
export type ReservationStatus = "PENDING" | "ACTIVE" | "COMPLETED" | "CANCELLED";

export interface Reservation {
  id: number;
  vehicleId: number;
  parkingLotId: number;
  userId: number;
  startTime: string;
  plannedDepartureTime?: string; // = startTime + plannedDuration
  endTime: string;
  totalPrice: number;
  status: ReservationStatus;
  durationHours?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReservationPayload {
  vehicleId: number;
  parkingLotId: number;
  startTime: string; // ISO 8601
  plannedDuration: number; // hours
}

export interface ReservationResponse {
  id: number;
  vehicleId: number;
  parkingLotId: number;
  userId: number;
  startTime: string;
  endTime: string;
  totalPrice: number;
  status: ReservationStatus;
  durationHours: number;
}

// ── Parking Session ────────────────────────────────────────────────
export type PaymentMethod = "CREDIT_CARD" | "DEBIT_CARD" | "BANK_TRANSFER" | "WALLET" | "PAYCELL";

export interface ParkingSession {
  id: number;
  reservationId: number;
  vehicleId: number;
  parkingLotId: number;
  userId: number;
  entryTime: string;
  exitTime?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ParkingSessionResponse {
  id: number;
  reservationId: number;
  vehicleId: number;
  parkingLotId: number;
  userId: number;
  entryTime: string;
  exitTime: string | null;
  durationMinutes: number | null;
  durationHours: number | null;
  chargedAmount: number | null;
  reservationFee: number | null;
  overstayFee: number | null;
  overstayMinutes: number | null;
}

export interface ExitSessionPayload {
  parkingSessionId: number;
  paymentMethod: PaymentMethod;
}
