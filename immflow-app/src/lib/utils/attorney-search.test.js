import { describe, expect, it } from "vitest";
import {
  filterAttorneysByRate,
  parseNaturalLanguageQuery,
  parseRateNumber,
} from "./attorney-search";

describe("parseRateNumber", () => {
  it("parses dollar amounts", () => {
    expect(parseRateNumber("$250/hr")).toBe(250);
    expect(parseRateNumber("200")).toBe(200);
  });

  it("returns null for empty values", () => {
    expect(parseRateNumber("")).toBeNull();
    expect(parseRateNumber(null)).toBeNull();
  });
});

describe("filterAttorneysByRate", () => {
  const attorneys = [
    { id: 1, rate: "$150/hr" },
    { id: 2, rate: "$275/hr" },
    { id: 3, rate: "Contact for quote" },
  ];

  it("filters by max rate", () => {
    const result = filterAttorneysByRate(attorneys, { maxRate: "200" });
    expect(result.map((a) => a.id)).toEqual([1, 3]);
  });

  it("filters by min rate", () => {
    const result = filterAttorneysByRate(attorneys, { minRate: "200" });
    expect(result.map((a) => a.id)).toEqual([2]);
  });

  it("returns all when no bounds", () => {
    expect(filterAttorneysByRate(attorneys, {})).toHaveLength(3);
  });
});

describe("parseNaturalLanguageQuery rate hints", () => {
  it("extracts under $200 from natural language", () => {
    const parsed = parseNaturalLanguageQuery("spanish asylum attorney under $200");
    expect(parsed.rateHint).toBe(200);
  });
});
