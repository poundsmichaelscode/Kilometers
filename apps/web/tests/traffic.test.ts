import { describe, expect, it } from "vitest";

import {
  incidentTypes,
  sampleReports,
} from "../src/features/traffic/data";

describe("KILOMETER traffic reporting", () => {
  it("supports seven incident categories", () => {
    expect(incidentTypes).toHaveLength(7);
  });

  it("contains unique incident category IDs", () => {
    const ids = incidentTypes.map((item) => item.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("assigns a valid colour to every incident type", () => {
    for (const incident of incidentTypes) {
      expect(incident.color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("contains three demonstration incidents", () => {
    expect(sampleReports).toHaveLength(3);
  });

  it("assigns valid categories to all sample reports", () => {
    const categories = incidentTypes.map((item) => item.id);

    for (const report of sampleReports) {
      expect(categories).toContain(report.type);
    }
  });

  it("contains a location for each report", () => {
    for (const report of sampleReports) {
      expect(report.location.trim().length).toBeGreaterThan(0);
    }
  });

  it("contains non-negative confirmation counts", () => {
    for (const report of sampleReports) {
      expect(report.confirmations).toBeGreaterThanOrEqual(0);
    }
  });

  it("clearly identifies demonstration reports", () => {
    for (const report of sampleReports) {
      expect(report.id).toMatch(/^demo-/);
    }
  });
});
