export type DemandBand = {
  maxScore: number;
  multiplier: number;
};

export type ScarcityBand = {
  maxRatio: number;
  multiplier: number;
};

export type PricingConfigInput = {
  baseMarkup: number;
  maxUplift: number;
  demandBands: DemandBand[];
  scarcityBands: ScarcityBand[];
};

export type PriceBreakdown = {
  basePriceCents: number;
  displayPriceCents: number;
  baseMarkup: number;
  demandMultiplier: number;
  scarcityMultiplier: number;
  demandScore: number;
  remainingSeats: number;
  totalSeats: number;
};
