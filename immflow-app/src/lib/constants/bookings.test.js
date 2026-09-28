import { describe, expect, it } from "vitest";
import { quoteBookingCents, quoteHourlyCents } from "./bookings";

const interpreter = {
  rate: "$150/hr remote · $200/hr in-person",
  profileData: { hourlyRateRemote: 150, hourlyRateInPerson: 200 },
};

describe("quoteHourlyCents", () => {
  it("uses the remote hourly rate for phone and video", () => {
    expect(quoteHourlyCents(interpreter, "phone")).toBe(15000);
    expect(quoteHourlyCents(interpreter, "video")).toBe(15000);
    expect(quoteHourlyCents(interpreter, "remote")).toBe(15000);
  });

  it("uses the in-person hourly rate for in-person bookings", () => {
    expect(quoteHourlyCents(interpreter, "in_person")).toBe(20000);
  });

  it("does not glue both amounts in a display rate into one number", () => {
    const displayOnly = { rate: "$150/hr remote · $200/hr in-person" };
    expect(quoteHourlyCents(displayOnly, "phone")).toBe(15000);
    expect(quoteHourlyCents(displayOnly, "in_person")).toBe(20000);
  });

  it("keeps a single listed rate", () => {
    expect(quoteHourlyCents({ rate: "$175/hr" }, "remote")).toBe(17500);
    expect(quoteHourlyCents({ rate: "$350 eval" }, "telehealth")).toBe(35000);
  });

  it("prices a 60-minute phone session at the remote hourly rate", () => {
    expect(
      quoteBookingCents(interpreter, {
        bookingType: "interpreter",
        modality: "phone",
        durationMinutes: 60,
      })
    ).toBe(15000);
  });

  it("prices in-person time from the in-person hourly rate", () => {
    expect(
      quoteBookingCents(interpreter, {
        bookingType: "interpreter",
        modality: "in_person",
        durationMinutes: 120,
      })
    ).toBe(40000);
  });

  it("keeps a psychological evaluation as a flat fee", () => {
    expect(
      quoteBookingCents(
        { rate: "$350 eval" },
        { bookingType: "psychological", modality: "telehealth", durationMinutes: 90 }
      )
    ).toBe(35000);
  });
});
