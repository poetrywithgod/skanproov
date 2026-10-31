/**
 * Demo data switch.
 *
 * The customer screens are built before the real scan, rewards and ads back end exists.
 * Until then they show the sample content from the design, but only while developing or
 * when SKANPROOV_DEMO=1 is set on purpose (for example on a private preview deployment).
 *
 * In a normal production build this is false: people see honest empty states, and
 * verification answers "unavailable" instead of ever claiming a product is genuine.
 */
export const demoDataEnabled = process.env.NODE_ENV !== "production" || process.env.SKANPROOV_DEMO === "1";
