import { z } from "zod";

/** Registering a shop and its first branch. */
export const retailerRegisterSchema = z.object({
  business: z.string().trim().min(2, "Enter your business name").max(160, "Name is too long"),
  branch: z.string().trim().min(2, "Enter a branch name").max(120, "Name is too long"),
  address: z.string().trim().min(3, "Enter the branch address").max(200, "Address is too long"),
  city: z.string().trim().min(2, "Enter the city").max(80, "City is too long"),
});
export type RetailerRegisterInput = z.input<typeof retailerRegisterSchema>;

export const STORE_TYPES = [
  "Supermarket",
  "Provision store",
  "Pharmacy",
  "Wholesaler",
  "Open market stall",
  "Other",
] as const;

/** Business details a Super Admin checks before they apply. The RC number is only for registered businesses. */
export const retailerProfileSchema = z.object({
  business: z.string().trim().min(2, "Enter your business name").max(160, "Name is too long"),
  storeType: z.enum(STORE_TYPES, { error: "Choose your type of store" }),
  rcNumber: z
    .string()
    .trim()
    .min(3, "Enter your CAC registration (RC) number")
    .max(20, "That RC number is too long")
    .regex(/^[A-Za-z0-9 -]+$/, "Use letters, numbers and dashes only")
    .optional(),
});
export type RetailerProfileInput = z.input<typeof retailerProfileSchema>;
