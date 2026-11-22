export type JourneyOption = {
  id: string;
  mode: string;
  durationMinutes: number;
  fareMin: number;
  fareMax: number;
  distanceKm: number;
  walkingMeters: number;
  transfers: number;
  badge: string;
  description: string;
  steps: string[];
};

export type JourneyFilter =
  | "recommended"
  | "fastest"
  | "cheapest"
  | "fewest";

export const journeyOptions: JourneyOption[] = [
  {
    id: "danfo-brt",
    mode: "Walk, danfo, BRT",
    durationMinutes: 100,
    fareMin: 1800,
    fareMax: 2500,
    distanceKm: 41,
    walkingMeters: 650,
    transfers: 1,
    badge: "Recommended",
    description: "One transfer, with a short walking section.",
    steps: [
      "Start from Lekki Phase 1",
      "Walk to an appropriate boarding point",
      "Take a connecting danfo service",
      "Transfer to a BRT service where available",
      "Arrive in the Ikeja area",
    ],
  },
  {
    id: "private-car",
    mode: "Private car",
    durationMinutes: 70,
    fareMin: 3500,
    fareMax: 5000,
    distanceKm: 38,
    walkingMeters: 0,
    transfers: 0,
    badge: "Illustrative traffic",
    description: "No transfers; actual traffic may change the journey.",
    steps: [
      "Depart from Lekki Phase 1",
      "Follow a suitable road route toward Ikeja",
      "Follow live directions once routing is connected",
      "Arrive at your destination",
    ],
  },
  {
    id: "taxi",
    mode: "Taxi",
    durationMinutes: 75,
    fareMin: 9000,
    fareMax: 14000,
    distanceKm: 38,
    walkingMeters: 0,
    transfers: 0,
    badge: "Estimated",
    description: "Direct journey without transfers.",
    steps: [
      "Request a taxi",
      "Confirm the pickup location",
      "Travel toward Ikeja",
      "Arrive at your destination",
    ],
  },
  {
    id: "brt-rail",
    mode: "Walk, BRT, rail",
    durationMinutes: 115,
    fareMin: 2200,
    fareMax: 3000,
    distanceKm: 44,
    walkingMeters: 900,
    transfers: 2,
    badge: "Illustrative option",
    description: "Multimodal example; connections are not verified.",
    steps: [
      "Walk toward a suitable transit stop",
      "Board a connecting public transport service",
      "Transfer where an appropriate connection exists",
      "Continue toward Ikeja",
      "Walk to the destination",
    ],
  },
];

export const journeyFilters: {
  id: JourneyFilter;
  label: string;
}[] = [
  { id: "recommended", label: "Recommended" },
  { id: "fastest", label: "Fastest" },
  { id: "cheapest", label: "Cheapest" },
  { id: "fewest", label: "Fewest transfers" },
];

export function sortJourneys(filter: JourneyFilter) {
  const options = [...journeyOptions];

  switch (filter) {
    case "fastest":
      return options.sort(
        (a, b) => a.durationMinutes - b.durationMinutes
      );
    case "cheapest":
      return options.sort((a, b) => a.fareMin - b.fareMin);
    case "fewest":
      return options.sort(
        (a, b) =>
          a.transfers - b.transfers ||
          a.durationMinutes - b.durationMinutes
      );
    default:
      return options;
  }
}

export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return `${hours} h ${remaining} min`;
}

export function formatFare(amount: number) {
  return `₦${amount.toLocaleString("en-NG")}`;
}
