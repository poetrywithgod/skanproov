/**
 * Central place for destinations. Routes marked TODO do not exist yet and are
 * built as the other screens arrive.
 */
export const site = {
  name: "SKANPROOV",
  tagline: "Product authentication for Nigerians",
  url: "https://skanproov.com", // TODO confirm production domain
  links: {
    scan: "/scan",
    verify: "/verify", // result screen: /verify/<code>
    login: "/login",
    register: "/register",
    home: "/home",
    history: "/history", // TODO real screen
    notifications: "/notifications", // TODO real screen
    profile: "/profile",
    editProfile: "/profile/edit",
    changePassword: "/profile/password",
    help: "/help",
    appLock: "/profile/app-lock",
    location: "/profile/location",
    twoFactor: "/profile/two-factor",
    deleteAccount: "/profile/delete",
    resetPassword: "/reset-password",
    report: "/report", // TODO report-a-fake flow
    forgotPassword: "/forgot-password", // TODO
    demo: "/demo", // TODO demo request form
  },
  retailer: {
    signup: "/retailer/signup",
    register: "/retailer/register",
    home: "/retailer",
    scan: "/retailer/scan",
    result: "/retailer/result", // /retailer/result/<code>
    manufacturers: "/retailer/manufacturers",
    history: "/retailer/history",
    notifications: "/retailer/notifications",
    profile: "/retailer/profile",
    businessProfile: "/retailer/profile/business",
  },
  manufacturer: {
    signup: "/manufacturer/signup",
    register: "/manufacturer/register", // business details, then waits for approval
    home: "/manufacturer", // the portal; opens on Products until the Overview is built
    products: "/manufacturer/products",
    batches: "/manufacturer/batches",
  },
  nav: [
    { label: "How it works", href: "#how-it-works" },
    { label: "Who it's for", href: "#who-its-for" },
    { label: "Intelligence", href: "#intelligence" },
  ],
} as const;
