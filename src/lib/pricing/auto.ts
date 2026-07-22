import {
  DEFAULT_DEMAND_BANDS,
  DEFAULT_SCARCITY_BANDS,
} from "./defaults";
import type { PricingConfigInput } from "./types";

/** Built-in automatic pricing — admins set base fares only; the system adjusts live. */
export const AUTO_PRICING = {
  baseMarkup: 0.08,
  maxUplift: 0.25,
  demandWindowMinutes: 45,
  quoteTtlMinutes: 15,
  demandBands: DEFAULT_DEMAND_BANDS,
  scarcityBands: DEFAULT_SCARCITY_BANDS,
} as const satisfies PricingConfigInput & {
  demandWindowMinutes: number;
  quoteTtlMinutes: number;
};
