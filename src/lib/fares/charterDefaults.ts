export type CharterFareSeed = {
  code: string;
  name: string;
  cabinClass: "economy" | "business";
  sortOrder: number;
  priceCents: number;
  tagline: string;
  recommended: boolean;
  mostPopular: boolean;
  flightChangeLabel: string;
  refundLabel: string;
  checkedBaggage: string;
  cabinBaggage: string;
  seatSelection: string;
  mealLabel: string;
  frequentFlyerLabel: string;
  priorityCheckIn: string;
  priorityBoarding: string;
  changePermitted: boolean;
  changeFeeLabel: string;
  refundPermitted: boolean;
  refundFeeLabel: string;
  perkLines: string[];
  changeBullets: string[];
  refundBullets: string[];
  baggageBullets: string[];
  nameChangeBullets: string[];
  noShowBullets: string[];
  loyaltyBullets: string[];
  notes: string;
};

/** Chaney charter fare matrix — Perth ⇄ Paro. */
export const CHARTER_FARE_DEFAULTS: CharterFareSeed[] = [
  {
    code: "saver",
    name: "Saver",
    cabinClass: "economy",
    sortOrder: 1,
    priceCents: 99900,
    tagline: "Limited Promotion",
    recommended: false,
    mostPopular: false,
    flightChangeLabel: "AUD 350 + Fare Difference",
    refundLabel: "Not Allowed",
    checkedBaggage: "1 Piece (23kg)",
    cabinBaggage: "7kg",
    seatSelection: "Standard Seat (Auto Assigned)",
    mealLabel: "Meal Included",
    frequentFlyerLabel: "Not Applicable",
    priorityCheckIn: "No",
    priorityBoarding: "No",
    changePermitted: true,
    changeFeeLabel: "With Fee AUD 350 + fare difference",
    refundPermitted: false,
    refundFeeLabel: "",
    perkLines: [
      "Limited Early Bird promotional fare",
      "Meal included",
      "Frequent Flyer: Not Applicable",
    ],
    changeBullets: [
      "Flight/date changes permitted with AUD 350 change fee plus any fare difference.",
      "Changes must be requested before departure.",
    ],
    refundBullets: [
      "Saver fares are non-refundable.",
      "Taxes may be refundable according to applicable regulations.",
    ],
    baggageBullets: [
      "Checked baggage: 1 piece up to 23kg.",
      "Cabin baggage: 7kg.",
    ],
    nameChangeBullets: [
      "Name corrections are not included on Saver.",
      "Contact reservations for assistance — a new booking may be required.",
    ],
    noShowBullets: [
      "No-show results in forfeiture of the fare.",
      "A new booking is required at the prevailing fare.",
    ],
    loyaltyBullets: [
      "Frequent flyer miles are not applicable on Saver.",
    ],
    notes: "AUD 999* Limited Early Bird",
  },
  {
    code: "standard",
    name: "Standard",
    cabinClass: "economy",
    sortOrder: 2,
    priceCents: 129900,
    tagline: "Most Popular",
    recommended: false,
    mostPopular: true,
    flightChangeLabel: "AUD 200 + Fare Difference",
    refundLabel: "50% Credit Voucher",
    checkedBaggage: "1 Piece (23kg)",
    cabinBaggage: "7kg",
    seatSelection: "Standard Seat Selection Included",
    mealLabel: "Meal Included",
    frequentFlyerLabel: "Standard accrual where applicable",
    priorityCheckIn: "No",
    priorityBoarding: "No",
    changePermitted: true,
    changeFeeLabel: "With Fee AUD 200 + fare difference",
    refundPermitted: true,
    refundFeeLabel: "50% credit voucher",
    perkLines: [
      "Standard seat selection included",
      "Meal included",
      "Priority check-in: No",
    ],
    changeBullets: [
      "Flight/date changes permitted with AUD 200 change fee plus any fare difference.",
      "Changes must be made before departure.",
    ],
    refundBullets: [
      "Cancellation before departure provides a 50% credit voucher.",
      "Voucher validity and usage conditions apply.",
    ],
    baggageBullets: [
      "Checked baggage: 1 piece up to 23kg.",
      "Cabin baggage: 7kg.",
    ],
    nameChangeBullets: [
      "Minor name corrections may be available with a service fee.",
      "Contact reservations before departure.",
    ],
    noShowBullets: [
      "No-show may reduce residual ticket value.",
      "Rebooking is subject to availability and fare difference.",
    ],
    loyaltyBullets: [
      "Standard frequent flyer accrual where the programme applies.",
    ],
    notes: "",
  },
  {
    code: "flexi",
    name: "Flexi",
    cabinClass: "economy",
    sortOrder: 3,
    priceCents: 149900,
    tagline: "Flexible",
    recommended: true,
    mostPopular: false,
    flightChangeLabel: "FREE (Fare Difference Applies)",
    refundLabel: "80% Refund Before Departure",
    checkedBaggage: "2 Pieces (23kg each)",
    cabinBaggage: "7kg",
    seatSelection: "Preferred Seat Selection Included",
    mealLabel: "Meal Included",
    frequentFlyerLabel: "Standard accrual where applicable",
    priorityCheckIn: "Included",
    priorityBoarding: "Included",
    changePermitted: true,
    changeFeeLabel: "Free (fare difference may apply)",
    refundPermitted: true,
    refundFeeLabel: "80% refund before departure",
    perkLines: [
      "Preferred seat selection included",
      "Priority check-in included",
      "Priority boarding included",
      "Meal included",
    ],
    changeBullets: [
      "Free flight/date changes before departure.",
      "Any fare difference is payable at the time of change.",
    ],
    refundBullets: [
      "80% refund available for cancellations before departure.",
      "Refunds are processed to the original form of payment where possible.",
    ],
    baggageBullets: [
      "Checked baggage: 2 pieces up to 23kg each.",
      "Cabin baggage: 7kg.",
    ],
    nameChangeBullets: [
      "Name corrections available with assistance from reservations.",
    ],
    noShowBullets: [
      "Contact reservations promptly after a missed flight for rebooking options.",
    ],
    loyaltyBullets: [
      "Standard frequent flyer accrual where the programme applies.",
    ],
    notes: "Recommended",
  },
  {
    code: "full_flexi",
    name: "Full Flexi",
    cabinClass: "economy",
    sortOrder: 4,
    priceCents: 179900,
    tagline: "Maximum Flexibility",
    recommended: false,
    mostPopular: false,
    flightChangeLabel: "Unlimited Flight/Date Changes",
    refundLabel: "100% Refund Before Departure",
    checkedBaggage: "2 Pieces (23kg each)",
    cabinBaggage: "7kg",
    seatSelection: "Premium Seat Selection",
    mealLabel: "Extra Meal Preference",
    frequentFlyerLabel: "Standard accrual where applicable",
    priorityCheckIn: "Included",
    priorityBoarding: "Included",
    changePermitted: true,
    changeFeeLabel: "Free — unlimited changes",
    refundPermitted: true,
    refundFeeLabel: "100% refund before departure",
    perkLines: [
      "Premium seat selection",
      "Priority check-in",
      "Priority boarding",
      "Extra meal preference",
      "Complimentary name correction (once)",
    ],
    changeBullets: [
      "Unlimited free flight/date changes before departure.",
      "Any applicable fare difference remains payable.",
    ],
    refundBullets: [
      "100% refund available for cancellations before departure.",
      "Refunds are typically processed within 7–14 business days.",
    ],
    baggageBullets: [
      "Checked baggage: 2 pieces up to 23kg each.",
      "Cabin baggage: 7kg.",
    ],
    nameChangeBullets: [
      "One complimentary name correction is included.",
      "Additional corrections may incur a service fee.",
    ],
    noShowBullets: [
      "Full Flexi retains strong rebooking flexibility after a missed flight — contact reservations.",
    ],
    loyaltyBullets: [
      "Standard frequent flyer accrual where the programme applies.",
    ],
    notes: "",
  },
  {
    code: "business_saver",
    name: "Business Saver",
    cabinClass: "business",
    sortOrder: 1,
    priceCents: 399900,
    tagline: "Business value",
    recommended: false,
    mostPopular: true,
    flightChangeLabel: "AUD 150 + Fare Difference",
    refundLabel: "70% Refund",
    checkedBaggage: "2 × 32kg",
    cabinBaggage: "7kg",
    seatSelection: "Business seat",
    mealLabel: "Business Meals",
    frequentFlyerLabel: "Business accrual where applicable",
    priorityCheckIn: "Lounge access (where available)",
    priorityBoarding: "Standard business",
    changePermitted: true,
    changeFeeLabel: "With Fee AUD 150 + fare difference",
    refundPermitted: true,
    refundFeeLabel: "70% refund",
    perkLines: [
      "2 × 32kg checked baggage",
      "Lounge access (where available)",
      "Business meals",
    ],
    changeBullets: [
      "Date changes permitted with AUD 150 change fee plus any fare difference.",
    ],
    refundBullets: [
      "70% refund available before departure subject to conditions.",
    ],
    baggageBullets: [
      "Checked baggage: 2 pieces up to 32kg each.",
      "Cabin baggage: 7kg.",
    ],
    nameChangeBullets: [
      "Name corrections available via reservations with applicable fees.",
    ],
    noShowBullets: [
      "Contact reservations for residual value and rebooking options.",
    ],
    loyaltyBullets: [
      "Business cabin frequent flyer accrual where the programme applies.",
    ],
    notes: "",
  },
  {
    code: "business_flexi",
    name: "Business Flexi",
    cabinClass: "business",
    sortOrder: 2,
    priceCents: 449900,
    tagline: "Full business flexibility",
    recommended: true,
    mostPopular: false,
    flightChangeLabel: "Free Flight Changes",
    refundLabel: "Full Refund",
    checkedBaggage: "2 × 32kg",
    cabinBaggage: "7kg",
    seatSelection: "Complimentary Seat Selection",
    mealLabel: "Premium Meals",
    frequentFlyerLabel: "Business accrual where applicable",
    priorityCheckIn: "Included",
    priorityBoarding: "Included",
    changePermitted: true,
    changeFeeLabel: "Free",
    refundPermitted: true,
    refundFeeLabel: "Full refund before departure",
    perkLines: [
      "2 × 32kg checked baggage",
      "Lounge access",
      "Priority check-in & boarding",
      "Premium meals",
      "Complimentary seat selection",
    ],
    changeBullets: [
      "Free flight/date changes before departure.",
      "Any fare difference may still apply when changing to a higher fare.",
    ],
    refundBullets: [
      "Full refund available before departure.",
    ],
    baggageBullets: [
      "Checked baggage: 2 pieces up to 32kg each.",
      "Cabin baggage: 7kg.",
    ],
    nameChangeBullets: [
      "Name corrections available via reservations.",
    ],
    noShowBullets: [
      "Strong rebooking flexibility — contact reservations after a missed flight.",
    ],
    loyaltyBullets: [
      "Business cabin frequent flyer accrual where the programme applies.",
    ],
    notes: "",
  },
];
