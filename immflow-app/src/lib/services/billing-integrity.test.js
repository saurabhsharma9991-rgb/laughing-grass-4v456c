import { describe, expect, it } from "vitest";
import {
  isMatchingBookingCheckout,
  isMatchingTranslationCheckout,
} from "./billing";

const order = { id: 12, clientId: 7, priceCents: 12500, currency: "usd" };
const validOrderSession = {
  mode: "payment",
  payment_status: "paid",
  amount_total: 12500,
  currency: "usd",
  metadata: {
    immflowOrderId: "12",
    immflowUserId: "7",
    immflowPaymentType: "translation_order",
  },
};

describe("payment integrity", () => {
  it("accepts only matching paid translation Checkout sessions", () => {
    expect(isMatchingTranslationCheckout(order, validOrderSession)).toBe(true);
    expect(
      isMatchingTranslationCheckout(order, {
        ...validOrderSession,
        amount_total: 100,
      })
    ).toBe(false);
    expect(
      isMatchingTranslationCheckout(order, {
        ...validOrderSession,
        payment_status: "unpaid",
      })
    ).toBe(false);
    expect(
      isMatchingTranslationCheckout(order, {
        ...validOrderSession,
        metadata: { ...validOrderSession.metadata, immflowUserId: "8" },
      })
    ).toBe(false);
  });

  it("accepts only matching paid booking Checkout sessions", () => {
    const booking = { id: 4, clientId: 9, priceCents: 9000, currency: "usd" };
    const session = {
      mode: "payment",
      payment_status: "paid",
      amount_total: 9000,
      currency: "usd",
      metadata: {
        immflowBookingId: "4",
        immflowUserId: "9",
        immflowPaymentType: "service_booking",
      },
    };
    expect(isMatchingBookingCheckout(booking, session)).toBe(true);
    expect(
      isMatchingBookingCheckout(booking, {
        ...session,
        metadata: { ...session.metadata, immflowBookingId: "5" },
      })
    ).toBe(false);
  });
});
