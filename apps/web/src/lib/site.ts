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
    getStarted: "/get-started", // TODO
    login: "/login",
    register: "/register",
    home: "/home",
    history: "/history", // TODO real screen
    notifications: "/notifications", // TODO real screen
    profile: "/profile",
    editProfile: "/profile/edit",
    changePassword: "/profile/password",
    help: "/help",
    deleteAccount: "/profile/delete",
    resetPassword: "/reset-password",
    report: "/report", // TODO report-a-fake flow
    forgotPassword: "/forgot-password", // TODO
    demo: "/demo", // TODO demo request form
  },
  nav: [
    { label: "How it works", href: "#how-it-works" },
    { label: "Who it's for", href: "#who-its-for" },
    { label: "Intelligence", href: "#intelligence" },
  ],
} as const;
