import type {
  DemandBand,
  PriceBreakdown,
  PricingConfigInput,
  ScarcityBand,
} from "./types";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function demandMultiplierFromScore(
  score: number,
  bands: DemandBand[],
): number {
  const sorted = [...bands].sort((a, b) => a.maxScore - b.maxScore);
  for (const band of sorted) {
    if (score <= band.maxScore) return band.multiplier;
  }
  return sorted.at(-1)?.multiplier ?? 1;
}

function scarcityMultiplierFromRatio(
  ratio: number,
  bands: ScarcityBand[],
): number {
  const sorted = [...bands].sort((a, b) => a.maxRatio - b.maxRatio);
  for (const band of sorted) {
    if (ratio <= band.maxRatio) return band.multiplier;
  }
  return sorted.at(-1)?.multiplier ?? 1;
}

export function calculatePrice(input: {
  basePriceCents: number;
  remainingSeats: number;
  totalSeats: number;
  demandScore: number;
  config: PricingConfigInput;
}): PriceBreakdown {
  const { basePriceCents, remainingSeats, totalSeats, demandScore, config } =
    input;

  const safeTotal = Math.max(totalSeats, 1);
  const ratio = remainingSeats / safeTotal;

  const demandMultiplier = demandMultiplierFromScore(
    demandScore,
    config.demandBands,
  );
  const scarcityMultiplier = scarcityMultiplierFromRatio(
    ratio,
    config.scarcityBands,
  );

  const raw =
    basePriceCents *
    (1 + config.baseMarkup) *
    demandMultiplier *
    scarcityMultiplier;

  const minPriceCents = basePriceCents;
  const maxPriceCents = Math.round(basePriceCents * (1 + config.maxUplift));
  const displayPriceCents = Math.round(clamp(raw, minPriceCents, maxPriceCents));

  return {
    basePriceCents,
    displayPriceCents,
    baseMarkup: config.baseMarkup,
    demandMultiplier,
    scarcityMultiplier,
    demandScore,
    remainingSeats,
    totalSeats,
  };
}
