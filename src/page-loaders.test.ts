import { describe, expect, it } from "vitest";
import { pageLoaderFor, pageLoaders } from "./page-loaders";
describe("entry route loading", () => {
  it.each([
    ["/", "home"], ["/men", "catalog"], ["/collections/streetwear", "catalog"], ["/search", "catalog"],
    ["/product/example", "product"], ["/checkout", "shopping"], ["/order-confirmation/123", "shopping"],
    ["/account/orders/123", "account"], ["/register", "account"], ["/admin/products", "admin"],
    ["/about", "information"], ["/unknown", "information"],
  ] as const)("selects the module for %s", (path, module) => {
    expect(pageLoaderFor(path)).toBe(pageLoaders[module]);
  });
});
