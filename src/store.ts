import { create } from "zustand";
import { persist } from "zustand/middleware";
import { seedProducts, seedProfiles, variantKey, itemKey } from "./data";
import type { Product, CartItem, Profile, Order } from "./data";
interface State {
  products: Product[];
  cart: CartItem[];
  wishlist: string[];
  orders: Order[];
  profiles: Profile[];
  session: Profile | null;
  cartOpen: boolean;
  toast: string;
  add: (item: CartItem) => boolean;
  quantity: (key: string, q: number) => void;
  remove: (key: string) => void;
  wish: (id: string) => void;
  notify: (message: string) => void;
  setCartOpen: (v: boolean) => void;
  signIn: (p: Profile) => void;
  signOut: () => void;
  saveProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (id: string, key: string, n: number) => void;
  orderStatus: (id: string, status: string) => void;
  checkout: (
    details: Omit<Order, "id" | "date" | "items" | "status" | "total">,
  ) => string | null;
}
export const useStore = create<State>()(
  persist(
    (set, get) => ({
      products: seedProducts,
      cart: [],
      wishlist: [],
      orders: [],
      profiles: seedProfiles,
      session: null,
      cartOpen: false,
      toast: "",
      notify: (message) => {
        set({ toast: message });
      },
      setCartOpen: (cartOpen) => set({ cartOpen }),
      add: (item) => {
        const p = get().products.find((p) => p.id === item.productId);
        const existing = get().cart.find((i) => itemKey(i) === itemKey(item));
        if (
          !p?.active ||
          !p.sizes.includes(item.size) ||
          !p.colors.includes(item.color) ||
          !Number.isInteger(item.quantity) ||
          item.quantity < 1 ||
          (p.stock[variantKey(item.color, item.size)] || 0) <
            item.quantity + (existing?.quantity || 0)
        ) {
          get().notify("This size and colour has insufficient stock.");
          return false;
        }
        set({
          cart: existing
            ? get().cart.map((i) =>
                itemKey(i) === itemKey(item)
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i,
              )
            : [...get().cart, item],
          toast: "Added to your bag.",
          cartOpen: true,
        });
        return true;
      },
      quantity: (key, q) => {
        if (!Number.isInteger(q)) return;
        if (q < 1) return get().remove(key);
        const i = get().cart.find((i) => itemKey(i) === key);
        const p = get().products.find((p) => p.id === i?.productId);
        if (i && p && (p.stock[variantKey(i.color, i.size)] || 0) >= q)
          set({
            cart: get().cart.map((i) =>
              itemKey(i) === key ? { ...i, quantity: q } : i,
            ),
          });
        else get().notify("No more stock for this variant.");
      },
      remove: (key) =>
        set({ cart: get().cart.filter((i) => itemKey(i) !== key) }),
      wish: (id) =>
        set({
          wishlist: get().wishlist.includes(id)
            ? get().wishlist.filter((x) => x !== id)
            : [...get().wishlist, id],
          toast: get().wishlist.includes(id)
            ? "Removed from saved pieces."
            : "Saved to your wishlist.",
        }),
      signIn: (p) =>
        set({
          session: p,
          profiles: [...get().profiles.filter((x) => x.email !== p.email), p],
        }),
      signOut: () => set({ session: null }),
      saveProduct: (p) =>
        set({
          products: get().products.some((x) => x.id === p.id)
            ? get().products.map((x) => (x.id === p.id ? p : x))
            : [...get().products, p],
          toast: "Demo product saved.",
        }),
      deleteProduct: (id) =>
        set({
          products: get().products.filter((p) => p.id !== id),
          cart: get().cart.filter((i) => i.productId !== id),
          wishlist: get().wishlist.filter((x) => x !== id),
          toast: "Demo product deleted.",
        }),
      adjustStock: (id, key, n) =>
        set({
          products: get().products.map((p) =>
            p.id === id
              ? {
                  ...p,
                  stock: {
                    ...p.stock,
                    [key]: Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0,
                  },
                }
              : p,
          ),
        }),
      orderStatus: (id, status) =>
        set({
          orders: get().orders.map((o) => (o.id === id ? { ...o, status } : o)),
        }),
      checkout: (details) => {
        const state = get();
        if (!state.cart.length) {
          state.notify("Your bag is empty.");
          return null;
        }
        for (const i of state.cart) {
          const p = state.products.find((p) => p.id === i.productId);
          if (
            !p?.active ||
            !Number.isInteger(i.quantity) ||
            i.quantity < 1 ||
            (p.stock[variantKey(i.color, i.size)] || 0) < i.quantity
          ) {
            state.notify("Stock changed. Please review your bag.");
            return null;
          }
        }
        const items = state.cart.map((i) => {
          const p = state.products.find((p) => p.id === i.productId)!;
          return {
            ...i,
            name: p.name,
            price: p.price,
            image: p.images[p.colors.indexOf(i.color) % p.images.length],
          };
        });
        const id = `AWM-${Date.now().toString(36).toUpperCase()}`;
        const order: Order = {
          ...details,
          id,
          date: new Date().toISOString(),
          items,
          status: "Placed",
          total:
            items.reduce((n, i) => n + i.price * i.quantity, 0) +
            details.shipping,
        };
        set({
          orders: [order, ...state.orders],
          cart: [],
          cartOpen: false,
          products: state.products.map((p) => {
            const stock = { ...p.stock };
            state.cart
              .filter((i) => i.productId === p.id)
              .forEach(
                (i) => (stock[variantKey(i.color, i.size)] -= i.quantity),
              );
            return { ...p, stock };
          }),
          profiles: [
            ...state.profiles.filter((p) => p.email !== details.customer.email),
            details.customer,
          ],
        });
        return id;
      },
    }),
    {
      name: "awm-demo-v1",
      version: 1,
      migrate: (persisted) => {
        const previous = persisted as Partial<State>;
        return {
          cart: previous.cart || [],
          wishlist: previous.wishlist || [],
          orders: previous.orders || [],
          profiles: previous.profiles || seedProfiles,
          session: previous.session || null,
          products:
            previous.products?.map((p) => {
              const seed = seedProducts.find((seed) => seed.id === p.id);
              return seed ? { ...p, images: seed.images } : p;
            }) || seedProducts,
        };
      },
      partialize: (s) => ({
        products: s.products,
        cart: s.cart,
        wishlist: s.wishlist,
        orders: s.orders,
        profiles: s.profiles,
        session: s.session,
      }),
    },
  ),
);
