/**
 * lib/shopify/cart-not-initialised.test.ts — Coverage for the
 * cart-cookie race-safety guards in lib/shopify/index.ts.
 *
 * The cart cookie is written by `CartProvider.createCartAndSetCookie`
 * on first visit. A fast click on "Add to cart" can land at the
 * server action before the cookie has been set — the previous code
 * silently passed `undefined` as the cartId into a Shopify mutation
 * and got a confusing 400. The refactor introduced
 * `CartNotInitialisedError`; this file pins that contract:
 *
 *   - The error is exported and has a stable name + message
 *   - addToCart, removeFromCart, updateCart all throw it when the
 *     cartId cookie is missing
 *   - When the cookie IS present, addToCart proceeds to shopifyFetch
 *     and reshapes the result
 *
 * Both `next/headers` (cookies) and `lib/shopify/_internal` (the
 * shopifyFetch + reshape helpers) are mocked at the module level so
 * the tests run in vitest's node env without a Next runtime and
 * without hitting a real Shopify endpoint.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The cookies-mock state is shared between tests; each test sets it
// in beforeEach via `setCookie(value | undefined)`. The factory passed
// to vi.mock runs once per worker, so we expose state through a module-
// level Map that the mock closes over.
const cookieJar = new Map<string, string>();
function setCookie(name: string, value: string | undefined) {
  if (value === undefined) cookieJar.delete(name);
  else cookieJar.set(name, value);
}

vi.mock("next/headers", () => {
  return {
    cookies: async () => ({
      get: (name: string) =>
        cookieJar.has(name) ? { name, value: cookieJar.get(name)! } : undefined,
      set: (name: string, value: string) => {
        cookieJar.set(name, value);
      },
    }),
  };
});

// Mock the transport layer + reshape helpers. `requireCartId` is
// internal to lib/shopify/index.ts; we exercise it through the public
// addToCart / removeFromCart / updateCart entry points and assert that
// shopifyFetch is (or isn't) called as expected.
const shopifyFetch = vi.fn();
const reshapeCart = vi.fn((cart: unknown) => cart);
const removeEdgesAndNodes = vi.fn();

vi.mock("./_internal", () => {
  return {
    shopifyFetch: (...args: unknown[]) => shopifyFetch(...args),
    reshapeCart: (cart: unknown) => reshapeCart(cart),
    removeEdgesAndNodes: (...args: unknown[]) => removeEdgesAndNodes(...args),
  };
});

// Import AFTER the mocks are registered.
import {
  addToCart,
  CartNotInitialisedError,
  removeFromCart,
  updateCart,
} from "./index";

beforeEach(() => {
  cookieJar.clear();
  shopifyFetch.mockReset();
  reshapeCart.mockReset();
  reshapeCart.mockImplementation((cart: unknown) => cart);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("CartNotInitialisedError", () => {
  it("is a real Error subclass with a stable name", () => {
    const err = new CartNotInitialisedError();
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("CartNotInitialisedError");
    expect(err.message).toMatch(/cart not initialised/i);
  });
});

describe("addToCart", () => {
  it("throws CartNotInitialisedError when the cartId cookie is missing", async () => {
    await expect(
      addToCart([{ merchandiseId: "gid://variant/1", quantity: 1 }]),
    ).rejects.toBeInstanceOf(CartNotInitialisedError);
    expect(shopifyFetch).not.toHaveBeenCalled();
  });

  it("calls shopifyFetch with the cookie's cartId when present", async () => {
    setCookie("cartId", "gid://cart/abc");
    shopifyFetch.mockResolvedValueOnce({
      body: { data: { cartLinesAdd: { cart: { id: "gid://cart/abc" } } } },
    });

    await addToCart([{ merchandiseId: "gid://variant/1", quantity: 1 }]);

    expect(shopifyFetch).toHaveBeenCalledTimes(1);
    const [callArgs] = shopifyFetch.mock.calls[0] as [
      { variables: { cartId: string; lines: unknown[] } },
    ];
    expect(callArgs.variables.cartId).toBe("gid://cart/abc");
    expect(callArgs.variables.lines).toEqual([
      { merchandiseId: "gid://variant/1", quantity: 1 },
    ]);
  });
});

describe("removeFromCart", () => {
  it("throws CartNotInitialisedError when the cartId cookie is missing", async () => {
    await expect(removeFromCart(["gid://line/1"])).rejects.toBeInstanceOf(
      CartNotInitialisedError,
    );
    expect(shopifyFetch).not.toHaveBeenCalled();
  });

  it("calls shopifyFetch with the cookie's cartId when present", async () => {
    setCookie("cartId", "gid://cart/abc");
    shopifyFetch.mockResolvedValueOnce({
      body: { data: { cartLinesRemove: { cart: { id: "gid://cart/abc" } } } },
    });

    await removeFromCart(["gid://line/1"]);

    expect(shopifyFetch).toHaveBeenCalledTimes(1);
    const [callArgs] = shopifyFetch.mock.calls[0] as [
      { variables: { cartId: string; lineIds: string[] } },
    ];
    expect(callArgs.variables.cartId).toBe("gid://cart/abc");
    expect(callArgs.variables.lineIds).toEqual(["gid://line/1"]);
  });
});

describe("updateCart", () => {
  it("throws CartNotInitialisedError when the cartId cookie is missing", async () => {
    await expect(
      updateCart([
        { id: "gid://line/1", merchandiseId: "gid://variant/1", quantity: 2 },
      ]),
    ).rejects.toBeInstanceOf(CartNotInitialisedError);
    expect(shopifyFetch).not.toHaveBeenCalled();
  });

  it("calls shopifyFetch with the cookie's cartId when present", async () => {
    setCookie("cartId", "gid://cart/abc");
    shopifyFetch.mockResolvedValueOnce({
      body: { data: { cartLinesUpdate: { cart: { id: "gid://cart/abc" } } } },
    });

    await updateCart([
      { id: "gid://line/1", merchandiseId: "gid://variant/1", quantity: 2 },
    ]);

    expect(shopifyFetch).toHaveBeenCalledTimes(1);
    const [callArgs] = shopifyFetch.mock.calls[0] as [
      {
        variables: {
          cartId: string;
          lines: { id: string; quantity: number }[];
        };
      },
    ];
    expect(callArgs.variables.cartId).toBe("gid://cart/abc");
    expect(callArgs.variables.lines[0]).toMatchObject({
      id: "gid://line/1",
      quantity: 2,
    });
  });
});
