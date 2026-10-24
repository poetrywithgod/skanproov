/**
 * Central place for destinations. Routes marked TODO do not exist yet and are
 * built as the other screens arrive.
 */
export const site = {
  name: "SKANPROOV",
  tagline: "Product authentication for Nigerians",
  url: "https://skanproov.com", // TODO confirm production domain
  links: {
    scan: "/scan", // TODO browser scan flow
    getStarted: "/get-started", // TODO
    login: "/login", // TODO shared auth entry
    demo: "/demo", // TODO demo request form
  },
  nav: [
    { label: "How it works", href: "#how-it-works" },
    { label: "Who it's for", href: "#who-its-for" },
    { label: "Intelligence", href: "#intelligence" },
  ],
} as const;
