import { describe, expect, it } from "vitest";

import {
  journeyOptions,
  sortJourneys,
  formatDuration,
  formatFare,
} from "../src/features/journeys/data";

describe("KILOMETER journey comparison", () => {
  it("contains four demonstration journey options", () => {
    expect(journeyOptions).toHaveLength(4);
  });

  it("contains unique journey IDs", () => {
    const ids = journeyOptions.map((journey) => journey.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("contains positive journey durations", () => {
    for (const journey of journeyOptions) {
      expect(journey.durationMinutes).toBeGreaterThan(0);
    }
  });

  it("contains valid fare ranges", () => {
    for (const journey of journeyOptions) {
      expect(journey.fareMin).toBeGreaterThanOrEqual(0);
      expect(journey.fareMax).toBeGreaterThanOrEqual(
        journey.fareMin
      );
    }
  });

  it("contains non-negative transfer counts", () => {
    for (const journey of journeyOptions) {
      expect(journey.transfers).toBeGreaterThanOrEqual(0);
    }
  });

  it("includes journey instructions", () => {
    for (const journey of journeyOptions) {
      expect(journey.steps.length).toBeGreaterThan(0);
    }
  });

  it("formats journey duration", () => {
    expect(formatDuration(100)).toBe("1 h 40 min");
  });

  it("formats fares in Nigerian naira", () => {
    expect(formatFare(1800)).toBe("₦1,800");
  });

  it("returns the recommended journey first", () => {
    expect(sortJourneys("recommended")[0].id).toBe(
      "danfo-brt"
    );
  });

  it("sorts journeys from fastest to slowest", () => {
    expect(
      sortJourneys("fastest").map((item) => item.id)
    ).toEqual([
      "private-car",
      "taxi",
      "danfo-brt",
      "brt-rail",
    ]);
  });

  it("sorts journeys from cheapest to most expensive", () => {
    expect(
      sortJourneys("cheapest").map((item) => item.id)
    ).toEqual([
      "danfo-brt",
      "brt-rail",
      "private-car",
      "taxi",
    ]);
  });

  it("sorts journeys by fewest transfers", () => {
    expect(
      sortJourneys("fewest").map((item) => item.id)
    ).toEqual([
      "private-car",
      "taxi",
      "danfo-brt",
      "brt-rail",
    ]);
  });

  it("uses duration to resolve equal transfer counts", () => {
    const results = sortJourneys("fewest");

    expect(results[0].transfers).toBe(0);
    expect(results[1].transfers).toBe(0);

    expect(results[0].durationMinutes).toBeLessThan(
      results[1].durationMinutes
    );
  });

  it("does not mutate the original journey collection", () => {
    const original = journeyOptions.map(
      (item) => item.id
    );

    sortJourneys("fastest");
    sortJourneys("cheapest");
    sortJourneys("fewest");

    expect(
      journeyOptions.map((item) => item.id)
    ).toEqual(original);
  });

  it("returns a new collection when sorting", () => {
    expect(sortJourneys("recommended")).not.toBe(
      journeyOptions
    );
  });
});
