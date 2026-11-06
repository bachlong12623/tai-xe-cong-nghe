import { describe, it, expect } from 'vitest';
import {
  createInitialDriverApp,
  evaluateDriverTier,
  checkAccountStatus,
  getCommissionRate,
  getDispatchPriority,
} from '../../src/sim/platform';

describe('Platform Tier & Disciplinary Engine (Section 7)', () => {
  it('correctly evaluates driver tiers based on completed trips and rating', () => {
    expect(evaluateDriverTier(20, 5.0)).toBe('bronze'); // < 50 trips
    expect(evaluateDriverTier(80, 4.82)).toBe('silver'); // >= 50, >= 4.80
    expect(evaluateDriverTier(180, 4.87)).toBe('gold'); // >= 150, >= 4.85
    expect(evaluateDriverTier(400, 4.95)).toBe('diamond'); // >= 300, >= 4.90

    // High trips but lower rating falls back
    expect(evaluateDriverTier(500, 4.75)).toBe('bronze');
  });

  it('rewards higher tiers with reduced platform commission and higher priority', () => {
    const bronzeComm = getCommissionRate('bronze');
    const diamondComm = getCommissionRate('diamond');
    expect(diamondComm).toBeLessThanOrEqual(bronzeComm);

    const bronzePri = getDispatchPriority('bronze');
    const diamondPri = getDispatchPriority('diamond');
    expect(diamondPri).toBeGreaterThan(bronzePri);
  });

  it('issues warning and suspends account when rating < 4.60 or cancel rate > 15%', () => {
    const app = createInitialDriverApp();
    app.rating = 4.45; // Below 4.60

    // 1st violation -> warning issued
    const firstCheck = checkAccountStatus(app);
    expect(firstCheck.warningIssued).toBe(true);
    expect(firstCheck.isSuspended).toBe(false);
    expect(firstCheck.app.warningCount).toBe(1);

    // 2nd violation -> account suspended
    const secondCheck = checkAccountStatus(firstCheck.app);
    expect(secondCheck.isSuspended).toBe(true);
    expect(secondCheck.app.isOnline).toBe(false);
    expect(secondCheck.app.suspendedUntilMinute).toBeDefined();
  });
});

