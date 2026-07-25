import { formatAud } from "@/lib/pricing";

export type FarePermitStatus = {
  permitted: boolean;
  feeLabel: string | null;
  bullets: string[];
};

export type FareProductTab = {
  id: string;
  label: string;
};

export type FareProduct = {
  id: string;
  name: string;
  cabinLabel: string;
  priceCents: number;
  mostPopular: boolean;
  available: boolean;
  highlights: {
    flightChange: string;
    refund: string;
    baggage: string;
    seatSelection: string;
    miles: string;
  };
  change: FarePermitStatus;
  refund: FarePermitStatus;
  baggageBullets: string[];
  nameChangeBullets: string[];
  noShowBullets: string[];
  loyaltyBullets: string[];
};

export const FARE_DETAIL_TABS: FareProductTab[] = [
  { id: "change_refund", label: "Flight Change & Refund" },
  { id: "baggage", label: "Baggage" },
  { id: "name_change", label: "Name Change" },
  { id: "no_show", label: "No Show" },
  { id: "loyalty", label: "Drukair Privilege" },
];

const TIER_DEFS = [
  {
    id: "saver",
    name: "Saver",
    multiplier: 0.88,
    mostPopular: false,
    highlights: {
      flightChange: "Not Allowed",
      refund: "Not allowed",
      baggage: "20kg",
      seatSelection: "Fee applies",
      miles: "50%",
    },
    change: {
      permitted: false,
      feeLabel: null,
      bullets: [
        "Flight and date changes are not permitted on Saver fares.",
        "If travel plans may change, choose Flexi or Full Flexi.",
      ],
    },
    refund: {
      permitted: false,
      feeLabel: null,
      bullets: [
        "Saver fares are non-refundable.",
        "Taxes may be refundable according to applicable regulations.",
      ],
    },
    baggageBullets: [
      "Checked baggage allowance: 20kg per passenger.",
      "Carry-on: 7kg (one piece).",
      "Excess baggage fees apply beyond the allowance.",
    ],
    nameChangeBullets: [
      "Name corrections are not permitted on Saver.",
      "A new booking is required for passenger name changes.",
    ],
    noShowBullets: [
      "No-show results in forfeiture of the fare.",
      "Subsequent travel requires a new booking at the prevailing fare.",
    ],
    loyaltyBullets: [
      "Earn 50% Drukair Privilege miles on the paid fare.",
      "Miles credit after travel is completed.",
    ],
  },
  {
    id: "standard",
    name: "Standard",
    multiplier: 1,
    mostPopular: true,
    highlights: {
      flightChange: "With fee",
      refund: "With fee",
      baggage: "30kg",
      seatSelection: "Standard seats",
      miles: "100%",
    },
    change: {
      permitted: true,
      feeLabel: "AUD 80",
      bullets: [
        "One flight or date change is permitted before departure.",
        "Fare difference may apply in addition to the change fee.",
        "Changes must be made at least 24 hours before departure.",
      ],
    },
    refund: {
      permitted: true,
      feeLabel: "AUD 120",
      bullets: [
        "Cancellation before departure is permitted with a refund fee.",
        "Refunds are processed to the original form of payment.",
      ],
    },
    baggageBullets: [
      "Checked baggage allowance: 30kg per passenger.",
      "Carry-on: 7kg (one piece).",
      "Standard seat selection included where available.",
    ],
    nameChangeBullets: [
      "Minor name corrections may be permitted with a fee.",
      "Contact reservations before departure for assistance.",
    ],
    noShowBullets: [
      "No-show may reduce the residual value of the ticket.",
      "Rebooking is subject to availability and fare difference.",
    ],
    loyaltyBullets: [
      "Earn 100% Drukair Privilege miles on the paid fare.",
      "Eligible for standard cabin upgrade waitlists.",
    ],
  },
  {
    id: "flexi",
    name: "Flexi",
    multiplier: 1.22,
    mostPopular: false,
    highlights: {
      flightChange: "AUD 40",
      refund: "AUD 60",
      baggage: "30kg",
      seatSelection: "Preferred",
      miles: "125%",
    },
    change: {
      permitted: true,
      feeLabel: "AUD 40",
      bullets: [
        "Unlimited flight and date changes before departure.",
        "Any fare difference is payable at the time of change.",
        "Changes can be made online or via reservations.",
      ],
    },
    refund: {
      permitted: true,
      feeLabel: "AUD 60",
      bullets: [
        "Refundable before departure with a reduced cancellation fee.",
        "Unused taxes are refundable where applicable.",
      ],
    },
    baggageBullets: [
      "Checked baggage allowance: 30kg per passenger.",
      "Carry-on: 7kg (one piece).",
      "Preferred seat selection included subject to availability.",
    ],
    nameChangeBullets: [
      "Name corrections permitted with a service fee.",
      "Legal name changes require supporting documentation.",
    ],
    noShowBullets: [
      "No-show protection: residual value may be applied to a new booking within 12 months.",
      "A no-show processing fee may apply.",
    ],
    loyaltyBullets: [
      "Earn 125% Drukair Privilege miles on the paid fare.",
      "Priority waitlist for cabin upgrades.",
    ],
  },
  {
    id: "full_flexi",
    name: "Full Flexi",
    multiplier: 1.48,
    mostPopular: false,
    highlights: {
      flightChange: "Free",
      refund: "Free",
      baggage: "40kg",
      seatSelection: "Any seat",
      miles: "150%",
    },
    change: {
      permitted: true,
      feeLabel: "Free",
      bullets: [
        "Unlimited free flight and date changes before departure.",
        "Only any applicable fare difference is payable.",
        "Same-day changes permitted where seats are available.",
      ],
    },
    refund: {
      permitted: true,
      feeLabel: "Free",
      bullets: [
        "Fully refundable before departure with no cancellation fee.",
        "Refunds are typically processed within 7–14 business days.",
      ],
    },
    baggageBullets: [
      "Checked baggage allowance: 40kg per passenger.",
      "Carry-on: 7kg (one piece) plus a personal item.",
      "Any available seat selection included at no charge.",
    ],
    nameChangeBullets: [
      "Name changes and corrections permitted free of charge before departure.",
      "Supporting documents may be required for legal name changes.",
    ],
    noShowBullets: [
      "Full Flexi tickets retain value after a no-show for 12 months.",
      "Reissue without penalty subject to fare difference.",
    ],
    loyaltyBullets: [
      "Earn 150% Drukair Privilege miles on the paid fare.",
      "Complimentary upgrade consideration on selected flights.",
    ],
  },
] as const;

export function buildFareProducts(input: {
  basePriceCents: number;
  cabinClass: string;
  farePriced: boolean;
}): FareProduct[] {
  const cabinLabel =
    input.cabinClass === "business" ? "Business" : "Economy";

  return TIER_DEFS.map((tier) => {
    const priceCents = Math.max(
      0,
      Math.round(input.basePriceCents * tier.multiplier),
    );
    return {
      id: tier.id,
      name: tier.name,
      cabinLabel,
      priceCents,
      mostPopular: tier.mostPopular,
      available: input.farePriced && priceCents > 0,
      highlights: {
        flightChange:
          tier.highlights.flightChange === "With fee"
            ? `With fee ${tier.change.feeLabel}`
            : tier.highlights.flightChange === "Free"
              ? "Free"
              : tier.highlights.flightChange,
        refund:
          tier.highlights.refund === "With fee"
            ? `With fee ${tier.refund.feeLabel}`
            : tier.highlights.refund === "Free"
              ? "Free"
              : tier.highlights.refund,
        baggage: tier.highlights.baggage,
        seatSelection: tier.highlights.seatSelection,
        miles: tier.highlights.miles,
      },
      change: {
        permitted: tier.change.permitted,
        bullets: [...tier.change.bullets],
        feeLabel:
          tier.change.feeLabel === "Free"
            ? "Free"
            : tier.change.feeLabel
              ? `With Fee ${tier.change.feeLabel}`
              : null,
      },
      refund: {
        permitted: tier.refund.permitted,
        bullets: [...tier.refund.bullets],
        feeLabel:
          tier.refund.feeLabel === "Free"
            ? "Free"
            : tier.refund.feeLabel
              ? `With Fee ${tier.refund.feeLabel}`
              : null,
      },
      baggageBullets: [...tier.baggageBullets],
      nameChangeBullets: [...tier.nameChangeBullets],
      noShowBullets: [...tier.noShowBullets],
      loyaltyBullets: [...tier.loyaltyBullets],
    };
  });
}

export function fareFooterNotes() {
  return [
    "Fares shown are per passenger and exclude optional extras unless stated.",
    "Change and refund fees are quoted in AUD and may vary by route and currency of original payment.",
    "Policies apply to unused tickets; partially used tickets are assessed case by case.",
  ];
}

export function formatFarePrice(cents: number) {
  return formatAud(cents);
}
