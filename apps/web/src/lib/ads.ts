import { demoDataEnabled } from "./demo";

/** Where an ad can appear. Add placements here as the app grows. */
export type AdPlacement = "result_top";

export interface Ad {
  id: string;
  advertiser: string;
  headline: string;
  /** Button text, e.g. "Order now". */
  cta: string;
  /** Where a tap goes. Opens in a new tab and is marked rel="sponsored". */
  href: string;
  /** Optional photo shown on the right of the banner. */
  imageSrc?: string;
  /** Background of the left panel when there is no photo-driven colour. */
  tone: "navy" | "green" | "plum";
}

const DEMO_ADS: Ad[] = [
  {
    id: "demo-carewell",
    advertiser: "CareWell Pharmacy",
    headline: "Genuine medicines, delivered same day",
    cta: "Order now",
    href: "https://example.com/carewell",
    tone: "navy",
  },
  {
    id: "demo-freshcart",
    advertiser: "FreshCart Groceries",
    headline: "Fresh produce, straight to your door",
    cta: "Shop now",
    href: "https://example.com/freshcart",
    tone: "green",
  },
  {
    id: "demo-quickpay",
    advertiser: "QuickPay",
    headline: "Buy airtime and data in seconds",
    cta: "Get started",
    href: "https://example.com/quickpay",
    tone: "plum",
  },
];

/**
 * Ads for a placement, in display order.
 *
 * TODO: read live campaigns (advertiser, schedule, targeting, budget) from the database and
 * record impressions and clicks. Until real campaigns are sold this returns nothing, so no
 * banner is rendered, except in demo mode.
 */
export async function getAds(_placement: AdPlacement): Promise<Ad[]> {
  return demoDataEnabled ? DEMO_ADS : [];
}
