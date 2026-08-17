import { describe, expect, it } from "vitest";
import { formatLegDistance, haversineMeters } from "./geo";

describe("haversineMeters", () => {
  it("returns zero for identical points", () => {
    const point = { lat: -36.8485, lon: 174.7633 };
    expect(haversineMeters(point, point)).toBe(0);
  });

  it("computes a known short distance", () => {
    const aucklandCbd = { lat: -36.8485, lon: 174.7633 };
    const nearby = { lat: -36.869, lon: 174.7772 };

    const meters = haversineMeters(aucklandCbd, nearby);
    expect(meters).toBeGreaterThan(2000);
    expect(meters).toBeLessThan(4000);
  });
});

describe("formatLegDistance", () => {
  it("formats meters under one kilometer", () => {
    expect(formatLegDistance(850)).toBe("850 m");
  });

  it("formats kilometers with one decimal place", () => {
    expect(formatLegDistance(2345)).toBe("2.3 km");
  });
});
