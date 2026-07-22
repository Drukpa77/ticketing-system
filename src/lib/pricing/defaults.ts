import type { DemandBand, ScarcityBand } from "./types";

export const DEFAULT_DEMAND_BANDS: DemandBand[] = [
  { maxScore: 5, multiplier: 1.0 },
  { maxScore: 20, multiplier: 1.05 },
  { maxScore: 50, multiplier: 1.12 },
  { maxScore: Number.MAX_SAFE_INTEGER, multiplier: 1.18 },
];

export const DEFAULT_SCARCITY_BANDS: ScarcityBand[] = [
  { maxRatio: 0.1, multiplier: 1.18 },
  { maxRatio: 0.2, multiplier: 1.1 },
  { maxRatio: 0.5, multiplier: 1.05 },
  { maxRatio: 1.0, multiplier: 1.0 },
];
