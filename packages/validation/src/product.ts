import { z } from "zod";

/** What a product is, for the Category filter and field. Not the same list as a company's category. */
export const PRODUCT_CATEGORIES = [
  "Food and beverages",
  "Alcoholic beverages",
  "Supplements",
  "Household products",
  "Personal care",
  "Pharmaceuticals and health",
  "Agrochemicals",
  "Building materials",
  "Other",
] as const;

export const PRODUCT_STATUSES = ["registered", "pending_review", "draft"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  registered: "Registered",
  pending_review: "Pending review",
  draft: "Draft",
};

export const PRODUCT_IMAGE_BUCKET = "product-images";
export const PRODUCT_IMAGE_MAX_BYTES = 2 * 1024 * 1024;
export const PRODUCT_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .transform((value) => value || undefined);

const name = z.string().trim().min(2, "Enter the product name").max(160, "Name is too long");

const sku = z
  .string()
  .trim()
  .min(2, "Enter the product SKU")
  .max(40, "SKU is too long")
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/, "Use letters, numbers, dashes, dots or slashes only")
  .transform((value) => value.toUpperCase());

const details = {
  variant: optionalText(80, "That is too long"),
  packSize: optionalText(80, "That is too long"),
  description: optionalText(200, "Keep it under 200 characters"),
  brand: optionalText(80, "That is too long"),
  nafdacNumber: optionalText(40, "That number is too long"),
  imagePath: z.string().trim().max(300).optional(),
};

/** A finished product: it gets registered and can have batches. */
export const productSchema = z.object({
  name,
  sku,
  category: z.enum(PRODUCT_CATEGORIES, { error: "Choose a category" }),
  ...details,
  draft: z.literal(false).default(false),
});

/** A product saved part-way: only the name is needed, and it cannot be used for batches yet. */
export const productDraftSchema = z.object({
  name,
  sku: z
    .string()
    .trim()
    .max(40, "SKU is too long")
    .optional()
    .transform((value) => value || undefined)
    .pipe(sku.optional()),
  category: z
    .string()
    .optional()
    .transform((value) => value || undefined)
    .pipe(z.enum(PRODUCT_CATEGORIES, { error: "Choose a category" }).optional()),
  ...details,
  draft: z.literal(true),
});

export type ProductInput = z.input<typeof productSchema>;
export type ProductData = z.output<typeof productSchema> | z.output<typeof productDraftSchema>;
