"use client";

/**
 * app/bureau/[itemId]/bureau/customer-form.tsx — Inline customer +
 * shipping form. Appears once the visitor's accepted a quote and hit
 * "Order this print". Posts to /api/bureau/order and routes to
 * /bureau/checkout/[orderId] on success.
 *
 * Server-side validation lives in the order route handler. This
 * form does only soft UX checks (required fields, email shape) so
 * the visitor sees feedback before the round-trip.
 */

import { useState } from "react";

export type CustomerFormSubmission = {
  customerEmail: string;
  customerName: string;
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    region?: string;
    postcode: string;
    country: string;
  };
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function CustomerForm({
  onSubmit,
  onCancel,
  busy,
  error,
}: {
  onSubmit: (input: CustomerFormSubmission) => void;
  onCancel: () => void;
  busy: boolean;
  error?: string | null;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [postcode, setPostcode] = useState("");
  const [country, setCountry] = useState("GB");

  const valid =
    EMAIL_RE.test(email.trim()) &&
    name.trim() &&
    line1.trim() &&
    city.trim() &&
    postcode.trim() &&
    country.trim();

  return (
    <form
      className="bp-cust"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        onSubmit({
          customerEmail: email.trim().toLowerCase(),
          customerName: name.trim(),
          shippingAddress: {
            line1: line1.trim(),
            ...(line2.trim() ? { line2: line2.trim() } : {}),
            city: city.trim(),
            ...(region.trim() ? { region: region.trim() } : {}),
            postcode: postcode.trim(),
            country: country.trim().toUpperCase(),
          },
        });
      }}
    >
      <div className="bp-cust-title">Your details</div>

      <label className="bp-cust-row">
        <span>Email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          maxLength={320}
        />
      </label>

      <label className="bp-cust-row">
        <span>Full name</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
          maxLength={120}
        />
      </label>

      <label className="bp-cust-row">
        <span>Address line 1</span>
        <input
          type="text"
          value={line1}
          onChange={(e) => setLine1(e.target.value)}
          required
          autoComplete="address-line1"
        />
      </label>

      <label className="bp-cust-row">
        <span>Address line 2 (optional)</span>
        <input
          type="text"
          value={line2}
          onChange={(e) => setLine2(e.target.value)}
          autoComplete="address-line2"
        />
      </label>

      <div className="bp-cust-grid">
        <label className="bp-cust-row">
          <span>City</span>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
            autoComplete="address-level2"
          />
        </label>
        <label className="bp-cust-row">
          <span>Region (optional)</span>
          <input
            type="text"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            autoComplete="address-level1"
          />
        </label>
      </div>

      <div className="bp-cust-grid">
        <label className="bp-cust-row">
          <span>Postcode</span>
          <input
            type="text"
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
            required
            autoComplete="postal-code"
            maxLength={20}
          />
        </label>
        <label className="bp-cust-row">
          <span>Country</span>
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            required
            autoComplete="country"
            maxLength={2}
            className="bp-cust-country"
          />
        </label>
      </div>

      {error && <p className="bp-cust-error">{error}</p>}

      <div className="bp-cust-actions">
        <button
          type="button"
          onClick={onCancel}
          className="bp-cust-cancel"
          disabled={busy}
        >
          Back
        </button>
        <button
          type="submit"
          className="bp-cust-pay"
          disabled={!valid || busy}
        >
          {busy ? "Creating order…" : "Continue to payment"}
        </button>
      </div>

      <p className="bp-cust-fineprint">
        We use your email to send the order confirmation + a shipping
        notification. Card details go to Stripe; we never see them.
      </p>
    </form>
  );
}
