# Reservation & Overstay Logic Implementation

## Overview
This document describes the comprehensive reservation system with overstay logic implementation, including pricing calculation, time management, and billing strategies.

## Database Schema (Prisma)

### Reservation Model
```prisma
model Reservation {
  id          Int       @id @default(autoincrement())
  vehicleId   Int
  parkingLotId Int
  userId      Int
  startTime   DateTime      // When the parking starts (scheduled)
  endTime     DateTime      // When parking should end (planned departure)
  totalPrice  Float         // Base price for reserved duration
  status      ReservationStatus @default(PENDING) // PENDING, ACTIVE, COMPLETED, CANCELLED
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model ParkingSession {
  id            Int       @id @default(autoincrement())
  reservationId Int       @unique
  vehicleId     Int
  parkingLotId  Int
  userId        Int
  entryTime     DateTime  @default(now())    // Actual entry time
  exitTime      DateTime?                    // Actual exit time (null until exit)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

### Key Difference
- **Reservation**: Planned stay (when and for how long you want to park)
- **ParkingSession**: Actual stay (tracks real entry/exit times)

---

## Pricing Logic

### 1. Reservation Creation Flow

**Input**: 
```typescript
{
  vehicleId: number,
  parkingLotId: number,
  startTime: Date,          // ISO 8601 string
  plannedDuration: number   // in hours (OR endTime)
}
```

**Calculation**:
1. If only `plannedDuration` is provided, calculate `endTime`:
   ```typescript
   endTime = startTime + (plannedDuration * 60 * 60 * 1000) milliseconds
   ```

2. Calculate duration hours (rounded up):
   ```typescript
   durationHours = Math.ceil((endTime - startTime) / (1000 * 60 * 60))
   ```

3. Calculate base price:
   ```typescript
   totalPrice = durationHours * parkingLot.hourlyRate
   ```

**Example**:
- Start: 2024-01-15 10:00
- Duration: 2.5 hours
- End: 2024-01-15 12:30
- Duration (rounded up): 3 hours
- Hourly rate: ₺50
- **Reserved price: 3 * 50 = ₺150**

---

### 2. Exit & Overstay Calculation

**When vehicle exits**, compare actual exit time with planned departure:

#### Case A: Normal Exit (On Time or Early)
```
If exitTime <= plannedEndTime:
  chargedAmount = ceil(actualDurationHours) * hourlyRate
  overstayFee = 0
```

**Example**:
- Entered: 10:00
- Exited: 11:45 (15 minutes early)
- Actual duration: ~1.75 hours → rounded up to 2 hours
- Hourly rate: ₺50
- **Charged: 2 * 50 = ₺100**

#### Case B: Overstay (Late Exit)
```
If exitTime > plannedEndTime:
  reservationFee = ceil(reservedDurationHours) * hourlyRate
  overstayFee = ceil(overstayDurationHours) * hourlyRate * OVERSTAY_PENALTY_MULTIPLIER (1.5x)
  totalFee = reservationFee + overstayFee
```

**Example**:
- Planned: 2 hours (Reserved price: 2 * 50 = ₺100)
- Actual exit: 2.5 hours after entry
- Extra stay: 0.5 hours → rounded up to 1 hour
- Overstay fee: 1 * 50 * 1.5 = ₺75
- **Total charged: ₺100 + ₺75 = ₺175**

---

### 3. Rounding Strategy

All calculations use **ceiling rounding**:
- **Duration calculation**: `Math.ceil(durationMs / (1000 * 60 * 60))`
- **Monetary values**: Rounded to 2 decimal places
- **Rationale**: Users pay for partial hours as full hours

**Example**:
- 30 minutes of parking = 1 hour charge
- 2 hours 15 minutes of parking = 3 hours charge
- Overstay of 10 minutes = 1 hour overstay charge

---

## API Endpoints

### Create Reservation
**POST** `/api/v1/reservations`

**Request**:
```json
{
  "vehicleId": 1,
  "parkingLotId": 5,
  "startTime": "2024-01-15T10:00:00Z",
  "plannedDuration": 2  // hours (OR use "endTime" instead)
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": 42,
    "vehicleId": 1,
    "parkingLotId": 5,
    "userId": 10,
    "startTime": "2024-01-15T10:00:00Z",
    "endTime": "2024-01-15T12:00:00Z",
    "totalPrice": 100,
    "status": "PENDING",
    "durationHours": 2
  },
  "message": "Rezervasyon başarıyla oluşturuldu."
}
```

---

### Record Vehicle Entry
**POST** `/api/v1/parking-sessions/entry`

**Request**:
```json
{
  "reservationId": 42,
  "vehicleId": 1,
  "parkingLotId": 5
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 7,
    "reservationId": 42,
    "entryTime": "2024-01-15T10:05:00Z",
    "exitTime": null,
    "status": "ACTIVE"
  }
}
```

---

### Record Vehicle Exit & Calculate Overstay
**POST** `/api/v1/parking-sessions/{parkingSessionId}/exit`

**Request**:
```json
{
  "paymentMethod": "CREDIT_CARD"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "session": {
      "id": 7,
      "entryTime": "2024-01-15T10:05:00Z",
      "exitTime": "2024-01-15T12:38:00Z",
      "durationMinutes": 153,
      "durationHours": 2.55,
      "chargedAmount": 175,
      "reservationFee": 100,
      "overstayFee": 75,
      "overstayMinutes": 38
    },
    "payment": {
      "paymentId": 88,
      "amount": 175,
      "status": "COMPLETED"
    }
  }
}
```

---

## Frontend Components

### ReservationForm Component
Located: `frontend/components/reservation/ReservationForm.tsx`

**Features**:
- Vehicle selection dropdown (fetches user's vehicles)
- Parking lot selection (with nearby detection via geolocation)
- Start time picker (datetime-local input)
- Planned duration selector (quick buttons + manual input)
- Real-time price preview calculation
- Planned departure time display
- Overstay warning message
- Form validation and error handling

**Usage**:
```tsx
import ReservationForm from "@/components/reservation/ReservationForm";

export default function Page() {
  return (
    <div>
      <ReservationForm
        onSuccess={(reservationId) => {
          console.log("Reservation created:", reservationId);
          // Redirect to confirmation page
        }}
        onError={(error) => {
          console.error("Reservation failed:", error);
        }}
      />
    </div>
  );
}
```

### Reservation Utilities
Located: `frontend/lib/reservationUtils.ts`

**Functions**:
- `calculateDurationHours()` - Calculate duration with ceiling rounding
- `calculateReservationFee()` - Calculate base fee
- `calculateBilling()` - Calculate complete billing with overstay logic
- `formatDuration()` - Format duration for display
- `calculatePlannedDeparture()` - Calculate planned exit time
- `isSlotAvailable()` - Check parking slot availability
- `getOccupancyStatus()` - Determine occupancy color (GREEN/YELLOW/RED)

---

## Backend Services

### ReservationService
**Methods**:
- `createReservation(data)` - Create new reservation with concurrency-safe capacity check
- `getReservation(id)` - Get reservation details
- `getUserReservations(userId)` - List user's reservations
- `cancelReservation(id)` - Cancel reservation
- `calculateDurationHours()` - Private helper
- `calculatePrice()` - Private helper

**Isolation Level**: Serializable (ensures no race conditions on capacity)

---

### ParkingSessionService
**Methods**:
- `recordEntry(data)` - Record vehicle entry and create session
- `recordExit(data)` - Record exit, calculate billing, and process payment
- `getSessionDetails(id)` - Get session details
- `getActiveSession(vehicleId)` - Get current active session
- `computeBilling()` - **Private method: Calculates overstay fees**
- `getUserSessions(userId)` - List user's sessions
- `getParkingLotStats()` - Get daily statistics

**Overstay Penalty Multiplier**: `1.5x` (configurable constant)

---

## Validation Schemas (Zod)

### Create Reservation Schema
```typescript
{
  body: {
    vehicleId: number,
    parkingLotId: number,
    startTime: ISO8601 datetime,
    endTime?: ISO8601 datetime,      // Optional if plannedDuration provided
    plannedDuration?: number (1-720 hours)  // Optional if endTime provided
  }
}
```

**Validation Rules**:
- Either `endTime` OR `plannedDuration` must be provided
- `startTime` must be in the future
- If `endTime` provided, it must be after `startTime`
- `plannedDuration` must be 1-720 hours (1 hour to 30 days)

---

## Database Transactions

### Reservation Creation (Atomic)
Uses Prisma Interactive Transaction with **Serializable** isolation level:

**Steps**:
1. Lock parking lot record
2. Count overlapping reservations (excluding CANCELLED/COMPLETED)
3. Verify capacity not exceeded (else return 409 Conflict)
4. Create new reservation record
5. Implicitly increment occupancy by 1

**Concurrency Protection**: PostgreSQL serialization failure (P2034) returns 409 Conflict to client

---

## Error Handling

### Common Errors

| Error | Status | Message |
|-------|--------|---------|
| Vehicle not found | 404 | "Araç bulunamadı." |
| Parking lot not found | 404 | "Otopark bulunamadı." |
| Capacity exceeded | 409 | "Otopark bu zaman aralığı için dolu..." |
| Invalid time range | 400 | "Bitiş zamanı başlangıç zamanından sonra olmalıdır." |
| Past start time | 400 | "Başlangıç zamanı gelecekte olmalıdır." |
| Race condition | 409 | "Rezervasyon çakışması tespit edildi. Lütfen tekrar deneyin." |
| Session already closed | 400 | "Bu araç zaten çıkış yapmış, session kapalı." |

---

## Testing Scenarios

### Scenario 1: Normal Reservation
- Reserve 2 hours at ₺50/hour
- Expected fee: ₺100
- Exit on time
- **Charged: ₺100** (no overstay)

### Scenario 2: Early Exit
- Reserve 2 hours at ₺50/hour
- Exit 30 minutes early
- Actual: 1.5 hours → rounds to 2 hours
- **Charged: ₺100**

### Scenario 3: Minor Overstay
- Reserve 2 hours at ₺50/hour
- Exit 20 minutes late
- Reserved: 2 hours = ₺100
- Overstay: 20 minutes → rounds to 1 hour = 1 * 50 * 1.5 = ₺75
- **Charged: ₺175**

### Scenario 4: Major Overstay
- Reserve 2 hours at ₺50/hour
- Exit 4 hours after entry (2 hours overstay)
- Reserved: 2 hours = ₺100
- Overstay: 2 hours = 2 * 50 * 1.5 = ₺150
- **Charged: ₺250**

### Scenario 5: Capacity Conflict
- Available slots: 1
- User A: Creates reservation (slots: 1/1)
- User B: Tries to create overlapping reservation
- **Result: 409 Conflict (retryable)**

---

## Future Enhancements

1. **Dynamic Pricing**: Adjust hourly rates based on demand
2. **Loyalty Discounts**: Apply discounts for frequent users
3. **Monthly Passes**: Fixed monthly fee for unlimited visits
4. **Multiple Vehicle Support**: Manage multiple vehicles per user
5. **Reservation Modifications**: Change reservation time/duration
6. **Cancellation Fees**: Apply fees if cancelled after certain time
7. **Invoice Generation**: Create PDF invoices for completed sessions
8. **Analytics Dashboard**: Track usage patterns and statistics

---

## Constants

```typescript
// Overstay penalty multiplier (1.5x normal rate)
OVERSTAY_PENALTY_MULTIPLIER = 1.5

// Occupancy status thresholds
GREEN:  0-50% occupied
YELLOW: 51-80% occupied
RED:    81-100% occupied

// API timeouts
GEOLOCATION_NEARBY_RADIUS_KM = 10 (default), max 50
PARKING_LOT_SEARCH_RADIUS = 1-50 km
```

---

## Related Files

### Backend
- `src/Services/reservationService.ts` - Reservation business logic
- `src/Services/parkingSessionService.ts` - Overstay calculation logic
- `src/Controllers/reservationController.ts` - API endpoints
- `src/Schemas/reservation.schema.ts` - Input validation
- `prisma/schema.prisma` - Database models

### Frontend
- `frontend/components/reservation/ReservationForm.tsx` - Reservation form UI
- `frontend/lib/api.ts` - API client methods
- `frontend/lib/reservationUtils.ts` - Calculation utilities
- `frontend/types/index.ts` - TypeScript types
- `frontend/hooks/useAuth.ts` - Auth state (uses reservationApi)
