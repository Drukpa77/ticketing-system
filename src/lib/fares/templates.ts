export type FareReleaseTemplate = {
  name: string;
  totalSeats: number;
  sortOrder: number;
};

/** Default Business 20-seat fare releases (prices set by admin). */
export const BUSINESS_FARE_TEMPLATE: FareReleaseTemplate[] = [
  { name: "Early Bird", totalSeats: 5, sortOrder: 1 },
  { name: "Business Standard", totalSeats: 10, sortOrder: 2 },
  { name: "Final Release", totalSeats: 5, sortOrder: 3 },
];

/** Default Economy fare releases (same structure; prices set by admin). */
export const ECONOMY_FARE_TEMPLATE: FareReleaseTemplate[] = [
  { name: "Early Bird", totalSeats: 5, sortOrder: 1 },
  { name: "Economy Standard", totalSeats: 10, sortOrder: 2 },
  { name: "Final Release", totalSeats: 5, sortOrder: 3 },
];

export function fareTemplateForCabin(
  cabin: string,
): FareReleaseTemplate[] {
  if (cabin === "economy") return ECONOMY_FARE_TEMPLATE.map((t) => ({ ...t }));
  return BUSINESS_FARE_TEMPLATE.map((t) => ({ ...t }));
}

export function totalSeatsFromReleases(
  releases: { totalSeats: number }[],
): number {
  return releases.reduce((sum, r) => sum + r.totalSeats, 0);
}
