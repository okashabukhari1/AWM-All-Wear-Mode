// Share the same imports between the boot loader and React.lazy.
export const pageLoaders = {
  home: () => import("./pages/Home"),
  catalog: () => import("./pages/Catalog"),
  product: () => import("./pages/Product"),
  shopping: () => import("./pages/Shopping"),
  account: () => import("./pages/Account"),
  information: () => import("./pages/Information"),
  admin: () => import("./pages/Admin"),
};

export function pageLoaderFor(pathname: string) {
  if (pathname === "/") return pageLoaders.home;
  if (/^\/admin(?:\/|$)/.test(pathname)) return pageLoaders.admin;
  if (/^\/product\//.test(pathname)) return pageLoaders.product;
  if (/^\/(men|women|new-arrivals|trending|collections|search)(?:\/|$)/.test(pathname)) return pageLoaders.catalog;
  if (/^\/(wishlist|cart|checkout|order-confirmation)(?:\/|$)/.test(pathname)) return pageLoaders.shopping;
  if (/^\/(login|register|account)(?:\/|$)/.test(pathname)) return pageLoaders.account;
  return pageLoaders.information;
}
