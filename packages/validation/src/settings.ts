import { z } from "zod";
import { normalizeNigerianPhone } from "./auth";

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((v) => (v === "" ? null : v));

/** The company's contact details, as edited in Settings. E-mail of the primary contact is not part of this. */
export const contactDetailsSchema = z.object({
  contactName: z.string().trim().min(2, "Enter the contact person's name").max(120, "Keep this under 120 characters"),
  contactRole: optionalText(60, "Keep this under 60 characters"),
  contactPhone: z
    .string()
    .trim()
    .transform((value, ctx) => {
      if (value === "") return null;
      const normalized = normalizeNigerianPhone(value);
      if (!normalized) {
        ctx.addIssue({ code: "custom", message: "Enter a valid Nigerian phone number" });
        return z.NEVER;
      }
      return normalized;
    }),
  qualityEmail: z
    .string()
    .trim()
    .max(254, "That e-mail is too long")
    .transform((v) => (v === "" ? null : v.toLowerCase()))
    .pipe(z.union([z.null(), z.email("Enter a valid e-mail address")])),
  website: z
    .string()
    .trim()
    .max(200, "Keep this under 200 characters")
    .transform((v) => (v === "" ? null : /^https?:\/\//i.test(v) ? v : `https://${v}`))
    .pipe(
      z.union([
        z.null(),
        z.string().refine((v) => {
          try {
            const u = new URL(v);
            return (u.protocol === "https:" || u.protocol === "http:") && u.hostname.includes(".");
          } catch {
            return false;
          }
        }, "Enter a valid website address"),
      ]),
    ),
});
export type ContactDetailsInput = z.input<typeof contactDetailsSchema>;
