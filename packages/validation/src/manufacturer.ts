import { z } from "zod";

export const MANUFACTURER_CATEGORIES = [
  "Food and beverages",
  "Household products",
  "Personal care and cosmetics",
  "Pharmaceuticals and health",
  "Agrochemicals",
  "Building materials",
  "Other",
] as const;

/** A manufacturer applying to join. SKANPROOV checks the details before the account goes live. */
export const manufacturerApplySchema = z.object({
  company: z.string().trim().min(2, "Enter your registered company name").max(160, "Name is too long"),
  rcNumber: z
    .string()
    .trim()
    .min(3, "Enter your CAC registration (RC) number")
    .max(20, "That RC number is too long")
    .regex(/^[A-Za-z0-9 -]+$/, "Use letters, numbers and dashes only"),
  nafdacNumber: z.string().trim().max(40, "That number is too long").optional(),
  category: z.enum(MANUFACTURER_CATEGORIES, { error: "Choose what you make" }),
  address: z.string().trim().min(3, "Enter the factory or office address").max(200, "Address is too long"),
  city: z.string().trim().min(2, "Enter the city").max(80, "City is too long"),
});
export type ManufacturerApplyInput = z.input<typeof manufacturerApplySchema>;
