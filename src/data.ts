export type Gender = "Men" | "Women";
export interface Product {
  id: string;
  slug: string;
  name: string;
  gender: Gender;
  category: string;
  description: string;
  price: number;
  images: string[];
  sizes: string[];
  colors: string[];
  stock: Record<string, number>;
  featured: boolean;
  isNew: boolean;
  trending: boolean;
  active: boolean;
}
export interface CartItem {
  productId: string;
  size: string;
  color: string;
  quantity: number;
}
export interface Profile {
  name: string;
  email: string;
  phone?: string;
}
export interface Order {
  id: string;
  date: string;
  customer: Profile;
  address: string;
  city: string;
  province: string;
  postal: string;
  payment: string;
  shipping: number;
  total: number;
  status: string;
  items: (CartItem & { name: string; price: number; image: string })[];
}
export const statuses = [
  "Placed",
  "Confirmed",
  "Processing",
  "Shipped",
  "Delivered",
];
export const categories = [
  "T-Shirts",
  "Shirts",
  "Pants",
  "Trousers",
  "Casualwear",
  "Streetwear",
];
export const money = (n: number) => `PKR ${n.toLocaleString("en-PK")}`;
export const photo = (id: string, w = 1000) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=85`;
export const imagery = {
  hero: photo("photo-1539109136881-3be0616acf4b", 1800),
  women: photo("photo-1539109136881-3be0616acf4b"),
  men: photo("photo-1617137968427-85924c800a22"),
  campaign: photo("photo-1524504388940-b1c1722653e1", 1600),
};
const shots: Record<string, string[]> = {
  "T-Shirts": [
    photo("photo-1521572163474-6864f9cf17ab"),
    photo("photo-1521572163474-6864f9cf17ab", 1400),
  ],
  Shirts: [
    photo("photo-1598033129183-c4f50c736f10"),
    photo("photo-1598554747436-c9293d6a588f"),
  ],
  Pants: [
    photo("photo-1542272604-787c3835535d"),
    photo("photo-1473966968600-fa801b869a1a"),
  ],
  Trousers: [
    photo("photo-1624378439575-d8705ad7ae80"),
    photo("photo-1473966968600-fa801b869a1a"),
  ],
  Casualwear: [
    photo("photo-1551028719-00167b16eac5"),
    photo("photo-1551232864-3f0890e580d9"),
  ],
  Streetwear: [
    photo("photo-1556821840-3a63f95609a7"),
    photo("photo-1544441893-675973e31985"),
  ],
};
const womenShots: Record<string, string[]> = {
  "T-Shirts": [
    photo("photo-1588343509724-a1d657a78a70"),
    photo("photo-1588343509724-a1d657a78a70", 1400),
  ],
  Shirts: [
    photo("photo-1624043553718-f369dab781aa"),
    photo("photo-1591287795585-1dd35e355faf"),
  ],
  Trousers: [
    photo("photo-1624043553718-f369dab781aa"),
    photo("photo-1473966968600-fa801b869a1a"),
  ],
};
const names = [
  [
    "Heavyweight Box Tee",
    "Everyday Rib Tee",
    "Relaxed Cotton Tee",
    "Essential Crew Tee",
  ],
  [
    "Studio Oxford Shirt",
    "Everyday Poplin Shirt",
    "Relaxed Linen Shirt",
    "Weekend Overshirt",
  ],
  [
    "Straight Leg Denim",
    "Wide Leg Denim",
    "Washed Denim",
    "Everyday Cargo Pants",
  ],
  [
    "Pleated Studio Trousers",
    "Relaxed Tailored Trousers",
    "Everyday Chinos",
    "Wide Leg Trousers",
  ],
  [
    "City Utility Jacket",
    "Weekend Denim Jacket",
    "Lightweight Layer",
    "Everyday Zip Jacket",
  ],
  [
    "Signature Box Hoodie",
    "Off Duty Sweatshirt",
    "Oversized Fleece Hoodie",
    "Studio Sweatshirt",
  ],
];
export const seedProducts: Product[] = Array.from({ length: 48 }, (_, i) => {
  const gender: Gender = i < 24 ? "Men" : "Women";
  const n = i % 24;
  const category = categories[Math.floor(n / 4)];
  const name = `${gender === "Women" ? "Women’s" : "Men’s"} ${names[Math.floor(n / 4)][n % 4]}`;
  const colors = n % 2 ? ["Black", "Stone"] : ["Stone", "Black"];
  const sizes = ["XS", "S", "M", "L", "XL"];
  return {
    id: `p${i + 1}`,
    slug: name
      .toLowerCase()
      .replace(/[’']/g, "")
      .replace(/[^a-z0-9]+/g, "-"),
    name,
    gender,
    category,
    description: `An easy ${category.toLowerCase().replace(/s$/, "")} with a considered fit and a clean silhouette. Made for layering, moving, and making it your own. Part of the AWM everyday edit.`,
    price:
      [2490, 4490, 5990, 5490, 8490, 6490][Math.floor(n / 4)] + (n % 4) * 300,
    images:
      gender === "Women" && womenShots[category]
        ? womenShots[category]
        : [shots[category][n % 2], shots[category][(n + 1) % 2]],
    sizes,
    colors,
    stock: Object.fromEntries(
      colors.flatMap((c) =>
        sizes.map((s) => [`${c}|${s}`, i % 11 === 0 ? 2 : 8 + (n % 5)]),
      ),
    ),
    featured: n % 4 === 0,
    isNew: n % 3 === 0,
    trending: n % 4 < 2,
    active: true,
  };
});
export const seedProfiles: Profile[] = [
  { name: "Demo Customer One", email: "customer.one@example.test" },
  { name: "Demo Customer Two", email: "customer.two@example.test" },
];
export const variantKey = (color: string, size: string) => `${color}|${size}`;
export const itemKey = (i: CartItem) => `${i.productId}|${i.color}|${i.size}`;
