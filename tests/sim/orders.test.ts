import { describe, it, expect } from 'vitest';
import { calculateOrderFare, generateOrderOffer, evaluateOrderArrivalProbability } from '../../src/sim/orders';
import { createRng } from '../../src/sim/rng';
import { createInitialTime } from '../../src/sim/time';
import { createInitialWeather } from '../../src/sim/weather';
import { createInitialDriverApp } from '../../src/sim/platform';
import { createGame, dispatch, step } from '../../src/sim/engine';

describe('Orders & Trips - Milestone 2 Specification', () => {
  const dummyTime = createInitialTime();
  const dummyWeather = createInitialWeather();
  const dummyApp = createInitialDriverApp();

  it('calculates food delivery fare correctly: 14k base for 2km + 4.5k/km', () => {
    // 4.0 km total: 2km base (14,000) + 2km * 4,500 = 23,000đ (no surge, no rain, peak = false)
    const fare = calculateOrderFare('food', 4.0, false, false, 1.0, 'bronze');
    expect(fare.grossFare).toBe(23000);
    // Bronze commission is 25%: 23,000 * 0.25 = 5,750
    expect(fare.commission).toBe(5750);
    expect(fare.netFare).toBe(23000 - 5750);
  });

  it('calculates passenger ride fare correctly: 12k base for 2km + 5.0k/km', () => {
    // 5.0 km total: 2km base (12,000) + 3km * 5,000 = 27,000đ
    const fare = calculateOrderFare('ride', 5.0, false, false, 1.0, 'silver');
    expect(fare.grossFare).toBe(27000);
    // Silver commission is 22%: 27,000 * 0.22 = 5,940
    expect(fare.commission).toBe(5940);
    expect(fare.netFare).toBe(27000 - 5940);
  });

  it('adds peak hour (+10%) and rain bonus (+7000đ) for food delivery', () => {
    const fare = calculateOrderFare('food', 2.0, true, true, 1.0, 'bronze');
    // base 14,000 * 1.10 = 15,400 + 7,000 rain = 22,400 -> rounded to ~22,000
    expect(fare.grossFare).toBeGreaterThanOrEqual(22000);
    expect(fare.rainBonus).toBe(7000);
  });

  it('generates a valid order offer with 12s countdown', () => {
    const rng = createRng(42);
    const prob = evaluateOrderArrivalProbability(dummyTime, dummyWeather, dummyApp, 'q1', rng);
    expect(prob).toBeGreaterThan(0);
    expect(prob).toBeLessThan(1);

    const offer = generateOrderOffer(rng, dummyTime, dummyWeather, dummyApp, 'q1');

    expect(offer.id).toBeDefined();
    expect(offer.grossFare).toBeGreaterThan(0);
    expect(offer.netFare).toBeGreaterThan(0);
    expect(offer.pickupDistanceKm).toBeGreaterThan(0);
    expect(offer.tripDistanceKm).toBeGreaterThan(0);
    expect(offer.countdownSeconds).toBe(12);
    expect(offer.stage).toBe('OFFERED');
  });

  it('handles accepting offer, trip execution, fuel consumption and payout in engine', () => {
    let game = createGame(100);
    game = dispatch(game, { t: 'GO_ONLINE' });

    // Step until an offer is generated
    let loops = 0;
    while (!game.app.currentOffer && loops < 50) {
      game = step(game, 1);
      loops++;
    }

    expect(game.app.currentOffer).not.toBeNull();
    const offer = game.app.currentOffer!;
    const offerId = offer.id;
    const initialFuel = game.vehicle.fuelCurrent;
    const initialOdo = game.vehicle.odometerKm;
    const initialCash = game.economy.cash;
    const initialWallet = game.economy.appWallet;

    // Accept offer
    game = dispatch(game, { t: 'ACCEPT_OFFER', id: offerId });
    expect(game.app.currentOffer).toBeNull();
    expect(game.app.activeTrip).not.toBeNull();
    expect(game.app.activeTrip?.stage).toBe('TO_PICKUP');

    // Step through the entire trip until completion
    let tripMinutes = 0;
    while (game.app.activeTrip && tripMinutes < 60) {
      game = step(game, 1);
      tripMinutes++;
    }

    // Trip should now be completed!
    expect(game.app.activeTrip).toBeNull();
    expect(game.economy.todayTrips).toBe(1);
    expect(game.economy.todayRevenue).toBe(offer.grossFare);

    // Fuel consumed and odometer increased
    expect(game.vehicle.fuelCurrent).toBeLessThan(initialFuel);
    expect(game.vehicle.odometerKm).toBeGreaterThan(initialOdo);

    // Finances updated
    if (offer.paymentMethod === 'cash') {
      // Driver received cash, wallet deducted commission
      expect(game.economy.cash).toBeGreaterThanOrEqual(initialCash + offer.grossFare);
      expect(game.economy.appWallet).toBe(initialWallet - offer.platformCommission);
    } else {
      // Driver wallet received net fare
      expect(game.economy.appWallet).toBe(initialWallet + offer.netFare);
    }
  });

  it('reduces acceptance rate and sets cooldown on offer rejection', () => {
    let game = createGame(200);
    game = dispatch(game, { t: 'GO_ONLINE' });

    // Step to get offer
    while (!game.app.currentOffer) {
      game = step(game, 1);
    }

    const offerId = game.app.currentOffer.id;
    const initialRate = game.app.acceptanceRate;

    game = dispatch(game, { t: 'REJECT_OFFER', id: offerId });
    expect(game.app.currentOffer).toBeNull();
    expect(game.app.acceptanceRate).toBeLessThan(initialRate);
    expect(game.app.cooldownUntilMinute).toBeGreaterThan(game.time.totalMinutes);
  });

  it('triggers Daily Summary modal at 05:00 next day with Net Profit calculation', () => {
    let game = createGame(300);
    game = dispatch(game, { t: 'GO_ONLINE' });

    // Step 24h (1440 minutes)
    game = step(game, 1440);

    expect(game.showDailySummaryModal).toBe(true);
    expect(game.pendingSummary).not.toBeNull();
    expect(game.pendingSummary?.day).toBe(1);
    expect(game.pendingSummary?.vehicleWearEstimate).toBeGreaterThanOrEqual(0);

    // Close modal
    game = dispatch(game, { t: 'CLOSE_SUMMARY_MODAL' });
    expect(game.showDailySummaryModal).toBe(false);
    expect(game.pendingSummary).toBeNull();
  });
});
