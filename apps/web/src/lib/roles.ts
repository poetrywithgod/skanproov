import { site } from "./site";

export type RoleId = "manufacturer" | "retailer" | "consumer";

export type Role = {
  id: RoleId;
  label: string;
  /** One line shown under the name wherever a person picks how they will use SKANPROOV. */
  blurb: string;
  signIn: string;
  signUp: string;
};

/** The three ways to use SKANPROOV. Shared by the header menu, the Get Started dialog and the auth screens. */
export const ROLES: readonly Role[] = [
  {
    id: "manufacturer",
    label: "Manufacturer",
    blurb: "Protect your products from factory to shelf.",
    signIn: `${site.links.login}?as=manufacturer`,
    signUp: site.manufacturer.signup,
  },
  {
    id: "retailer",
    label: "Retailer",
    blurb: "Check every carton before it reaches your shelves.",
    signIn: `${site.links.login}?as=retailer`,
    signUp: site.retailer.signup,
  },
  {
    id: "consumer",
    label: "Consumer",
    blurb: "Scan products and earn rewards for genuine ones.",
    signIn: `${site.links.login}?as=consumer`,
    signUp: site.links.register,
  },
];

export function parseRole(value: unknown): RoleId | null {
  return ROLES.find((role) => role.id === value)?.id ?? null;
}

export function getRole(id: RoleId | null): Role | null {
  return ROLES.find((role) => role.id === id) ?? null;
}
