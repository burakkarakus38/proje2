import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3000/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

// ── Request interceptor: Authorization header ekle ────────────────
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: 401 → token yenile veya logout ─────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      typeof window !== "undefined"
    ) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
          refreshToken,
        });

        const newAccessToken = data.data.accessToken;
        localStorage.setItem("accessToken", newAccessToken);
        if (data.data.refreshToken) {
          localStorage.setItem("refreshToken", data.data.refreshToken);
        }

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch {
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

// ── Auth API fonksiyonları ────────────────────────────────────────
import type {
  LoginPayload,
  RegisterPayload,
  OtpPayload,
  LoginResponse,
  RegisterResponse,
  ApiResponse,
} from "@/types";

export const authApi = {
  login: (payload: LoginPayload) =>
    api.post<ApiResponse<LoginResponse>>("/auth/login", payload),

  register: (payload: RegisterPayload) =>
    api.post<ApiResponse<RegisterResponse>>("/auth/register", payload),

  verifyOtp: (payload: OtpPayload) =>
    api.post<ApiResponse<LoginResponse>>("/auth/verify-otp", payload),

  requestLoginOtp: (payload: { gsm: string }) =>
    api.post<ApiResponse<{ gsm: string; verificationCode: string }>>("/auth/request-login-otp", payload),

  verifyLoginOtp: (payload: OtpPayload) =>
    api.post<ApiResponse<LoginResponse>>("/auth/verify-login-otp", payload),

  refreshToken: (refreshToken: string) =>
    api.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
      "/auth/refresh-token",
      { refreshToken }
    ),

  logout: (refreshToken: string) =>
    api.post<ApiResponse<null>>("/auth/logout", { refreshToken }),
};

// ── Reservation API ────────────────────────────────────────────────
import type {
  Vehicle,
  ParkingLot,
  Reservation,
  CreateReservationPayload,
  ReservationResponse,
  ParkingSessionResponse,
  ExitSessionPayload,
} from "@/types";

export const reservationApi = {
  createReservation: (payload: CreateReservationPayload) =>
    api.post<ApiResponse<ReservationResponse>>("/reservations", payload),

  getReservation: (reservationId: number) =>
    api.get<ApiResponse<ReservationResponse>>(`/reservations/${reservationId}`),

  getUserReservations: (status?: string, limit?: number, offset?: number) => {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (limit) params.append("limit", limit.toString());
    if (offset) params.append("offset", offset.toString());
    return api.get<ApiResponse<ReservationResponse[]>>(
      `/reservations?${params.toString()}`
    );
  },

  cancelReservation: (reservationId: number) =>
    api.delete<ApiResponse<null>>(`/reservations/${reservationId}`),
};

// ── Vehicle API ────────────────────────────────────────────────────
export const vehicleApi = {
  getUserVehicles: () =>
    api.get<ApiResponse<Vehicle[]>>("/vehicles"),

  getVehicle: (vehicleId: number) =>
    api.get<ApiResponse<Vehicle>>(`/vehicles/${vehicleId}`),
};

// ── Parking Lot API ────────────────────────────────────────────────
export const parkingLotApi = {
  getParkingLot: (parkingLotId: number) =>
    api.get<ApiResponse<ParkingLot>>(`/parking/${parkingLotId}`),

  findNearby: (latitude: number, longitude: number, radiusKm?: number) => {
    const params = new URLSearchParams();
    params.append("latitude", latitude.toString());
    params.append("longitude", longitude.toString());
    if (radiusKm) params.append("radiusKm", radiusKm.toString());
    return api.get<ApiResponse<ParkingLot[]>>(
      `/parking/nearby?${params.toString()}`
    );
  },
};

// ── Parking Session API ────────────────────────────────────────────
export const parkingSessionApi = {
  recordEntry: (reservationId: number, vehicleId: number, parkingLotId: number) =>
    api.post<ApiResponse<ParkingSessionResponse>>("/parking-sessions/entry", {
      reservationId,
      vehicleId,
      parkingLotId,
    }),

  recordExit: (payload: ExitSessionPayload) =>
    api.post<ApiResponse<{ session: ParkingSessionResponse; payment: any }>>(
      `/parking-sessions/${payload.parkingSessionId}/exit`,
      { paymentMethod: payload.paymentMethod }
    ),

  getSessionDetails: (parkingSessionId: number) =>
    api.get<ApiResponse<ParkingSessionResponse>>(
      `/parking-sessions/${parkingSessionId}`
    ),

  getActiveSession: (vehicleId: number) =>
    api.get<ApiResponse<ParkingSessionResponse | null>>(
      `/parking-sessions/vehicle/${vehicleId}/active`
    ),
};
