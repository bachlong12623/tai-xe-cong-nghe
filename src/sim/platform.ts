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

export function getCommissionRate(tier: DriverTier): number {
  return (pricingData.platformCommissionByTier as Record<string, number>)[tier] ?? 0.25;
}

export function getDispatchPriority(tier: DriverTier): number {
  return (pricingData.dispatchPriorityByTier as Record<string, number>)[tier] ?? 1.0;
}

