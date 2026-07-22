export type DemandEventLike = {
  type: "view" | "hold" | "purchase";
};

const WEIGHTS: Record<DemandEventLike["type"], number> = {
  view: 1,
  hold: 5,
  purchase: 10,
};

export function computeDemandScore(events: DemandEventLike[]): number {
  return events.reduce((sum, event) => sum + (WEIGHTS[event.type] ?? 0), 0);
}
