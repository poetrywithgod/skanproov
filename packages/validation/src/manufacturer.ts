import { z } from "zod";
import { email, normalizeNigerianPhone, PASSWORD_MIN_LENGTH } from "./auth";

export const MANUFACTURER_CATEGORIES = [
  "Food and beverages",
  "Alcoholic beverages",
  "Household products",
  "Personal care and cosmetics",
  "Pharmaceuticals and health",
  "Agrochemicals",
  "Building materials",
  "Other",
] as const;

export const STAFF_RANGES = ["1-20", "21-50", "51-100", "101-250", "251+"] as const;

export const CONTACT_ROLES = [
  "Managing Director",
  "Director",
  "Operations Manager",
  "Regulatory or Compliance Officer",
  "Other",
] as const;

/** The documents a company uploads for verification. `note` is the line shown under the title. */
export const MANUFACTURER_DOCUMENTS = [
  {
    kind: "registration_certificate",
    label: "Company registration certificate",
    note: "Photo or scan of your certificate of incorporation · PDF, JPG or PNG · required",
    required: true,
  },
  {
    kind: "regulatory_certificate",
    label: "Regulatory certificate",
    note: "Where applicable to your products · optional",
    required: false,
  },
  {
    kind: "tax_clearance",
    label: "Tax clearance certificate",
    note: "PDF, JPG or PNG",
    required: false,
  },
  {
    kind: "director_id",
    label: "ID of a director or authorised signatory",
    note: "Photo or scan · required",
    required: true,
  },
  {
    kind: "premises_photo",
    label: "Photo of company premises or signage",
    note: "Helps us confirm your business address · optional",
    required: false,
  },
] as const;
export type ManufacturerDocumentKind = (typeof MANUFACTURER_DOCUMENTS)[number]["kind"];

export const DOCUMENT_MAX_BYTES = 5 * 1024 * 1024;
export const DOCUMENT_TYPES = ["application/pdf", "image/jpeg", "image/png"] as const;
export const MANUFACTURER_DOCUMENT_BUCKET = "manufacturer-documents";

function nigerianPhone(message: string) {
  return z
    .string()
    .trim()
    .min(1, message)
    .transform((value, ctx) => {
      const normalized = normalizeNigerianPhone(value);
      if (!normalized) {
        ctx.addIssue({ code: "custom", message: "Enter a valid Nigerian phone number" });
        return z.NEVER;
      }
      return normalized;
    });
}

/** The company's details, as collected on the "Register your Company" screen. */
export const manufacturerCompanySchema = z.object({
  company: z.string().trim().min(2, "Enter your registered company name").max(160, "Name is too long"),
  companyEmail: email,
  companyPhone: nigerianPhone("Enter the company phone number"),
  address: z.string().trim().min(3, "Enter the company address").max(200, "Address is too long"),
  state: z.string().trim().min(2, "Choose a state").max(40, "State is too long"),
  city: z.string().trim().min(2, "Enter the city").max(80, "City is too long"),
  rcNumber: z
    .string()
    .trim()
    .min(3, "Enter your CAC registration (RC) number")
    .max(20, "That RC number is too long")
    .regex(/^[A-Za-z0-9 -]+$/, "Use letters, numbers and dashes only"),
  tin: z
    .string()
    .trim()
    .min(1, "Enter your tax identification number")
    .regex(/^[0-9][0-9-]{4,18}[0-9]$/, "Use numbers and dashes only, like 0000-002-002"),
  regulatoryNumber: z
    .string()
    .trim()
    .max(40, "That number is too long")
    .optional()
    .transform((value) => value || undefined),
  yearIncorporated: z.coerce
    .number({ error: "Choose the year" })
    .int("Choose the year")
    .min(1900, "Choose the year")
    .max(new Date().getFullYear(), "That year is in the future"),
  staffRange: z.enum(STAFF_RANGES, { error: "Choose the number of staff" }),
  category: z.enum(MANUFACTURER_CATEGORIES, { error: "Choose what you make" }),
  contactName: z.string().trim().min(2, "Enter the contact person's full name").max(120, "Name is too long"),
  contactPhone: nigerianPhone("Enter the contact person's phone number"),
  contactRole: z.enum(CONTACT_ROLES, { error: "Choose their role in the company" }),
});
export type ManufacturerCompanyInput = z.input<typeof manufacturerCompanySchema>;
export type ManufacturerCompany = z.output<typeof manufacturerCompanySchema>;

/** Company details plus the account the company signs in with (its e-mail is the company e-mail). */
export const manufacturerSignupSchema = manufacturerCompanySchema
  .extend({
    password: z
      .string()
      .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters`)
      .max(128, "Password is too long"),
    confirmPassword: z.string().min(1, "Confirm your password"),
    agree: z.literal(true, { error: "Please confirm this to continue" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
export type ManufacturerSignupInput = z.input<typeof manufacturerSignupSchema>;
export type ManufacturerSignup = z.output<typeof manufacturerSignupSchema>;
