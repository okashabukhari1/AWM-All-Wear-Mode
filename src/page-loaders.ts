// Share the same imports between the boot loader and React.lazy.
export const pageLoaders = {
  catalog: () => import("./pages/Catalog"),
  product: () => import("./pages/Product"),
  shopping: () => import("./pages/Shopping"),
  account: () => import("./pages/Account"),
  information: () => import("./pages/Information"),
  admin: () => import("./pages/Admin"),
};
