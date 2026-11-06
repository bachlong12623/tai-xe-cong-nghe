import { DriverApp, DriverTier } from './types';
import pricingData from '../../data/pricing.json';

export function createInitialDriverApp(): DriverApp {
  const initialHistory = Array(46).fill(5).concat(Array(4).fill(4)); // 4.92 average
  return {
    isOnline: false,
    rating: 4.92,
    ratingHistory: initialHistory,
    totalTripsCompleted: 120,
    acceptanceRate: 0.94,
    cancellationRate: 0.02,
    tier: 'silver',
    warningCount: 0,
    suspendedUntilMinute: null,
    cooldownUntilMinute: null,
    currentOffer: null,
    activeTrip: null,
  };
}

export function evaluateDriverTier(totalTrips: number, rating: number): DriverTier {
  if (totalTrips >= 300 && rating >= 4.90) return 'diamond';
  if (totalTrips >= 150 && rating >= 4.85) return 'gold';
  if (totalTrips >= 50 && rating >= 4.80) return 'silver';
  return 'bronze';
}

export function checkAccountStatus(app: DriverApp): { isSuspended: boolean; warningIssued: boolean; app: DriverApp; message?: string } {
  const isRatingBad = app.rating < 4.60;
  const isCancelHigh = app.cancellationRate > 0.15;

  if (isRatingBad || isCancelHigh) {
    const newWarnings = app.warningCount + 1;
    if (newWarnings >= 2) {
      // Suspend for 24 hours (1440 minutes)
      return {
        isSuspended: true,
        warningIssued: true,
        app: {
          ...app,
          isOnline: false,
          warningCount: newWarnings,
          suspendedUntilMinute: 1440, // relative to current, handled in engine
        },
        message: 'Tài khoản bị tạm khóa 1 ngày do tỷ lệ đánh giá thấp (<4.6) hoặc tỷ lệ hủy chuyến quá cao (>15%)!',
      };
    } else {
      return {
        isSuspended: false,
        warningIssued: true,
        app: {
          ...app,
          warningCount: newWarnings,
        },
        message: 'Cảnh cáo từ nền tảng: Đánh giá sao hoặc tỷ lệ hủy chuyến đang vi phạm quy định!',
      };
    }
  }

  return { isSuspended: false, warningIssued: false, app };
}

export function getCommissionRate(tier: DriverTier): number {
  return (pricingData.platformCommissionByTier as Record<string, number>)[tier] ?? 0.25;
}

export function getDispatchPriority(tier: DriverTier): number {
  return (pricingData.dispatchPriorityByTier as Record<string, number>)[tier] ?? 1.0;
}
