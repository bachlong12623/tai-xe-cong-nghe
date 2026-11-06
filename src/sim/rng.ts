/**
 * Mulberry32 seeded Pseudo-Random Number Generator.
 * Deterministic and serializable.
 */
export interface RngState {
  seed: number;
  state: number;
}

export function createRng(seed: number): RngState {
  return {
    seed,
    state: seed >>> 0,
  };
}

/**
 * Returns a float in [0, 1) and updates rng.state.
 */
export function nextFloat(rng: RngState): number {
  let t = (rng.state += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  rng.state = rng.state >>> 0;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/**
 * Returns integer in [min, max] inclusive.
 */
export function nextInt(rng: RngState, min: number, max: number): number {
  const f = nextFloat(rng);
  return Math.floor(f * (max - min + 1)) + min;
}

/**
 * Returns a random element from an array.
 */
export function choose<T>(rng: RngState, items: T[]): T {
  const idx = nextInt(rng, 0, items.length - 1);
  return items[idx];
}

/**
 * Standard Normal variate using Box-Muller transform with seeded RNG.
 */
export function nextGaussian(rng: RngState, mean = 0, stdev = 1): number {
  const u1 = Math.max(1e-15, nextFloat(rng));
  const u2 = nextFloat(rng);
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + z0 * stdev;
}

