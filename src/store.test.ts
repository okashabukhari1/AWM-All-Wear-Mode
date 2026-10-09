import { beforeEach, describe, expect, it } from "vitest";
import { seedProducts, seedProfiles, variantKey, itemKey } from "./data";
const memory = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (k: string) => memory.get(k) ?? null,
    setItem: (k: string, v: string) => memory.set(k, v),
    removeItem: (k: string) => memory.delete(k),
  },
  configurable: true,
});
Object.defineProperty(globalThis, "window", {
  value: { localStorage: globalThis.localStorage },
  configurable: true,
});
const { useStore } = await import("./store");
const item = { productId: "p2", color: "Black", size: "M", quantity: 2 };
const details = {
  customer: { name: "Test Demo", email: "test@example.test" },
  address: "123 Demo Road",
  city: "Lahore",
  province: "Punjab",
  postal: "54000",
  payment: "Cash on Delivery (Demo)",
  shipping: 250,
};
beforeEach(() => {
  memory.clear();
  useStore.setState({
    products: structuredClone(seedProducts),
    cart: [],
    wishlist: [],
    orders: [],
    profiles: structuredClone(seedProfiles),
    session: null,
    toast: "",
    cartOpen: false,
  });
});
describe("catalogue integrity", () => {
  it("seeds at least 40 unique complete products", () => {
    expect(seedProducts.length).toBeGreaterThanOrEqual(40);
    expect(new Set(seedProducts.map((p) => p.slug)).size).toBe(
      seedProducts.length,
    );
    for (const p of seedProducts) {
      expect(p.images.length).toBeGreaterThan(0);
      for (const c of p.colors)
        for (const z of p.sizes)
          expect(p.stock[variantKey(c, z)]).toBeGreaterThanOrEqual(0);
    }
  });
});
describe("persistent shopping and inventory", () => {
  it("preserves variants and merges only equal variants", () => {
    const s = useStore.getState();
    s.add(item);
    s.add({ ...item, quantity: 1 });
    s.add({ ...item, size: "L", quantity: 1 });
    expect(useStore.getState().cart).toEqual([
      { ...item, quantity: 3 },
      { ...item, size: "L", quantity: 1 },
    ]);
  });
  it("rejects unavailable, invalid and excessive variants", () => {
    const s = useStore.getState();
    expect(s.add({ ...item, size: "INVALID" })).toBe(false);
    expect(s.add({ ...item, quantity: 999 })).toBe(false);
    expect(s.add({ ...item, quantity: 0 })).toBe(false);
    s.adjustStock("p2", variantKey(item.color, item.size), 0);
    expect(s.add(item)).toBe(false);
  });
  it("limits quantity to stock and removes zero quantities", () => {
    const s = useStore.getState();
    s.add(item);
    s.quantity(itemKey(item), 999);
    expect(useStore.getState().cart[0].quantity).toBe(2);
    s.quantity(itemKey(item), 0);
    expect(useStore.getState().cart).toHaveLength(0);
  });
  it("persists cart and wishlist and restores them", async () => {
    const s = useStore.getState();
    s.add(item);
    s.wish("p2");
    const saved = memory.get("awm-demo-v1")!;
    expect(JSON.parse(saved).state.cart[0]).toEqual(item);
    useStore.setState({ cart: [], wishlist: [] }, false);
    memory.set("awm-demo-v1", saved);
    await useStore.persist.rehydrate();
    expect(useStore.getState().wishlist).toContain("p2");
    expect(useStore.getState().cart[0]).toEqual(item);
  });
  it("creates an immutable order snapshot, reduces exact variant stock, and clears bag", () => {
    const s = useStore.getState();
    const before = s.products.find((p) => p.id === "p2")!.stock[
      variantKey(item.color, item.size)
    ];
    s.add(item);
    const id = s.checkout(details);
    const after = useStore.getState();
    expect(id).toBeTruthy();
    expect(after.cart).toHaveLength(0);
    expect(after.orders[0].items[0]).toMatchObject(item);
    expect(after.orders[0].total).toBe(seedProducts[1].price * 2 + 250);
    expect(
      after.products.find((p) => p.id === "p2")!.stock[
        variantKey(item.color, item.size)
      ],
    ).toBe(before - 2);
    s.deleteProduct("p2");
    expect(useStore.getState().orders[0].items[0].name).toBe(
      seedProducts[1].name,
    );
  });
  it("prevents checkout when stock changes after adding", () => {
    const s = useStore.getState();
    s.add(item);
    s.adjustStock("p2", variantKey(item.color, item.size), 1);
    expect(s.checkout(details)).toBeNull();
    expect(useStore.getState().cart).toHaveLength(1);
    expect(useStore.getState().orders).toHaveLength(0);
  });
  it("supports admin CRUD and storefront visibility", () => {
    const s = useStore.getState();
    const p = {
      ...structuredClone(seedProducts[0]),
      id: "demo-new",
      slug: "demo-new",
      name: "Demo New",
    };
    s.saveProduct(p);
    expect(useStore.getState().products.find((x) => x.id === p.id)?.name).toBe(
      "Demo New",
    );
    s.saveProduct({ ...p, price: 1234 });
    expect(useStore.getState().products.find((x) => x.id === p.id)?.price).toBe(
      1234,
    );
    s.deleteProduct(p.id);
    expect(useStore.getState().products.some((x) => x.id === p.id)).toBe(false);
  });
  it("updates customer tracking from admin order changes", () => {
    const s = useStore.getState();
    s.add(item);
    const id = s.checkout(details)!;
    s.orderStatus(id, "Shipped");
    expect(useStore.getState().orders[0].status).toBe("Shipped");
  });
  it("stores demo profiles without any password", () => {
    const s = useStore.getState();
    s.signIn(details.customer);
    expect(useStore.getState().session).toEqual(details.customer);
    expect(JSON.stringify(memory.get("awm-demo-v1"))).not.toContain("password");
    s.signOut();
    expect(useStore.getState().session).toBeNull();
  });
});
