import { describe, expect, it } from "vitest";
import {
  checkMeasurements,
  convertText,
  emptyRawMeasurements,
  parseMeasurement,
  suggestPattern,
  toCm,
} from "./measurements";

describe("parseMeasurement", () => {
  it("accepts plain numbers, decimals and decimal commas", () => {
    expect(parseMeasurement("78")).toBe(78);
    expect(parseMeasurement(" 78.5 ")).toBe(78.5);
    expect(parseMeasurement("78,5")).toBe(78.5);
  });
  it("rejects anything else", () => {
    for (const bad of ["", "abc", "-5", "7 8", "78cm", "1e3", "1234"]) {
      expect(parseMeasurement(bad)).toBeNull();
    }
  });
});

describe("units", () => {
  it("converts inches to centimetres and back for display", () => {
    expect(toCm(10, "in")).toBeCloseTo(25.4);
    expect(convertText("30", "in", "cm")).toBe("76.2");
    expect(convertText("76.2", "cm", "in")).toBe("30");
    expect(convertText("abc", "cm", "in")).toBe("abc");
  });
});

describe("checkMeasurements", () => {
  it("reports missing required fields for women (bust, waist, hips) but not optional ones", () => {
    const check = checkMeasurements({ ...emptyRawMeasurements, waist: "70" }, "cm", "women");
    expect(check.missing.sort()).toEqual(["chest", "hips"]);
    expect(check.errors).toEqual({});
  });

  it("needs only chest and waist for men", () => {
    const check = checkMeasurements({ ...emptyRawMeasurements, chest: "100", waist: "84" }, "cm", "men");
    expect(check.missing).toEqual([]);
    expect(check.values).toEqual({ chest: 100, waist: 84 });
  });

  it("validates sensibly in either unit", () => {
    const cm = checkMeasurements({ ...emptyRawMeasurements, chest: "10", waist: "70", hips: "95" }, "cm", "women");
    expect(cm.errors.chest).toMatch(/between 60 and 180 cm/);
    const inches = checkMeasurements({ ...emptyRawMeasurements, chest: "36", waist: "28", hips: "38" }, "in", "women");
    expect(inches.errors).toEqual({});
    expect(inches.values.chest).toBeCloseTo(91.4, 1);
    const typo = checkMeasurements({ ...emptyRawMeasurements, chest: "9o", waist: "70", hips: "95" }, "cm", "women");
    expect(typo.errors.chest).toMatch(/number/);
  });
});

describe("suggestPattern (tentative, proportions only)", () => {
  it("women", () => {
    expect(suggestPattern({ chest: 92, waist: 68, hips: 94 }, "women").shape).toBe("hourglass");
    expect(suggestPattern({ chest: 86, waist: 70, hips: 100 }, "women").shape).toBe("pear");
    expect(suggestPattern({ chest: 100, waist: 76, hips: 90 }, "women").shape).toBe("inverted-triangle");
    expect(suggestPattern({ chest: 90, waist: 74, hips: 92 }, "women").shape).toBe("rectangle");
    expect(suggestPattern({ chest: 98, waist: 94, hips: 99 }, "women").shape).toBe("apple");
  });
  it("men", () => {
    expect(suggestPattern({ chest: 100, waist: 92 }, "men").shape).toBe("rectangle");
    expect(suggestPattern({ chest: 104, waist: 90 }, "men").shape).toBe("trapezoid");
    expect(suggestPattern({ chest: 116, waist: 88 }, "men").shape).toBe("inverted-triangle");
    expect(suggestPattern({ chest: 96, waist: 96 }, "men").shape).toBe("apple");
    expect(suggestPattern({ chest: 94, waist: 84, hips: 102 }, "men").shape).toBe("pear");
  });
  it("says so when there is not enough to go on", () => {
    expect(suggestPattern({ chest: 90 }, "women").shape).toBeNull();
    expect(suggestPattern({ chest: 90, waist: 70 }, "women").shape).toBeNull();
  });
});
