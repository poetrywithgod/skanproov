import { z } from "zod";

/** Registering a shop and its first branch. */
export const retailerRegisterSchema = z.object({
  business: z.string().trim().min(2, "Enter your business name").max(160, "Name is too long"),
  branch: z.string().trim().min(2, "Enter a branch name").max(120, "Name is too long"),
  address: z.string().trim().min(3, "Enter the branch address").max(200, "Address is too long"),
  city: z.string().trim().min(2, "Enter the city").max(80, "City is too long"),
});
export type RetailerRegisterInput = z.input<typeof retailerRegisterSchema>;
