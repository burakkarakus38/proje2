/**
 * Reservation Calculation Utilities
 * Provides functions for calculating prices, durations, and overstay fees
 */

export const OVERSTAY_PENALTY_MULTIPLIER = 1.5;

/**
 * Calculate duration in hours (rounded up)
 */
export function calculateDurationHours(startTime: Date, endTime: Date): number {
  const durationMs = endTime.getTime() - startTime.getTime();
  const hours = durationMs / (1000 * 60 * 60);
  return Math.ceil(hours);
}

/**
 * Calculate base reservation fee
 * Formula: durationHours * hourlyRate
 */
export function calculateReservationFee(
  durationHours: number,
  hourlyRate: number
): number {
  return Math.round(durationHours * hourlyRate * 100) / 100;
}

/**
 * Calculate total parking fee for exit
 * 
 * If normal exit (on time or early):
 *   fee = ceil(actualDurationHours) * hourlyRate
 *
 * If overstay:
 *   reservationFee = ceil(reservedHours) * hourlyRate
 *   overstayFee = ceil(overstayHours) * hourlyRate * OVERSTAY_PENALTY_MULTIPLIER
 *   totalFee = reservationFee + overstayFee
 */
export function calculateBilling(
  entryTime: Date,
  exitTime: Date,
  scheduledEndTime: Date,
  hourlyRate: number
): {
  reservationFee: number;
  overstayFee: number;
  overstayMinutes: number;
  totalFee: number;
} {
  const round2 = (n: number) => Math.round(n * 100) / 100;

  if (exitTime <= scheduledEndTime) {
    // Normal exit — bill the actual stay at the standard rate
    const actualMs = exitTime.getTime() - entryTime.getTime();
    const actualHours = Math.ceil(actualMs / (1000 * 60 * 60));
    const reservationFee = round2(actualHours * hourlyRate);

    return {
      reservationFee,
      overstayFee: 0,
      overstayMinutes: 0,
      totalFee: reservationFee,
    };
  }

  // Overstay — bill reserved window at normal rate, extra window at penalty rate
  const reservedMs = scheduledEndTime.getTime() - entryTime.getTime();
  const reservedHours = Math.ceil(reservedMs / (1000 * 60 * 60));
  const reservationFee = round2(reservedHours * hourlyRate);

  const overstayMs = exitTime.getTime() - scheduledEndTime.getTime();
  const overstayMinutes = Math.ceil(overstayMs / (1000 * 60));
  const overstayHours = Math.ceil(overstayMs / (1000 * 60 * 60));
  const penaltyRate = hourlyRate * OVERSTAY_PENALTY_MULTIPLIER;
  const overstayFee = round2(overstayHours * penaltyRate);

  return {
    reservationFee,
    overstayFee,
    overstayMinutes,
    totalFee: round2(reservationFee + overstayFee),
  };
}

/**
 * Format duration for display
 */
export function formatDuration(hours: number, minutes: number = 0): string {
  if (hours === 0 && minutes === 0) return "0 dakika";
  if (hours === 0) return `${minutes} dakika`;
  if (minutes === 0) return `${hours} saat`;
  return `${hours} saat ${minutes} dakika`;
}

/**
 * Calculate planned departure time
 */
export function calculatePlannedDeparture(
  startTime: Date,
  durationHours: number
): Date {
  return new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);
}

/**
 * Check if time slot is available (given occupancy and capacity)
 */
export function isSlotAvailable(
  currentOccupancy: number,
  capacity: number
): boolean {
  return currentOccupancy < capacity;
}

/**
 * Get occupancy status color
 */
export function getOccupancyStatus(
  currentOccupancy: number,
  capacity: number
): "GREEN" | "YELLOW" | "RED" {
  if (capacity === 0) return "GREEN";
  const occupiedPct = (currentOccupancy / capacity) * 100;
  if (occupiedPct <= 50) return "GREEN";
  if (occupiedPct <= 80) return "YELLOW";
  return "RED";
}

/**
 * Get occupancy status label
 */
export function getOccupancyLabel(status: "GREEN" | "YELLOW" | "RED"): string {
  const labels = {
    GREEN: "Boş",
    YELLOW: "Yarı dolu",
    RED: "Dolu",
  };
  return labels[status];
}
