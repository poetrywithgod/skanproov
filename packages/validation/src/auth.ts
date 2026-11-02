import { z } from "zod";

const email = z
  .string()
  .trim()
  .min(1, "Enter your e-mail address")
  .max(254, "E-mail address is too long")
  .pipe(z.email("Enter a valid e-mail address"))
  .transform((value) => value.toLowerCase());

/** Accepts 0903-456-1234, 0903 456 1234, 09034561234 or +234 903 456 1234. */
export function normalizeNigerianPhone(input: string): string | null {
  const digits = input.replace(/[\s\-().]/g, "");
  const match = /^(?:\+?234|0)([789][01]\d{8})$/.exec(digits);
  return match?.[1] ? `+234${match[1]}` : null;
}

const phone = z
  .string()
  .trim()
  .min(1, "Enter your phone number")
  .transform((value, ctx) => {
    const normalized = normalizeNigerianPhone(value);
    if (!normalized) {
      ctx.addIssue({ code: "custom", message: "Enter a valid Nigerian phone number" });
      return z.NEVER;
    }
    return normalized;
  });

export const PASSWORD_MIN_LENGTH = 8;

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password"),
  remember: z.boolean().default(false),
});
export type LoginInput = z.input<typeof loginSchema>;

const fullName = z.string().trim().min(2, "Enter your full name").max(120, "Name is too long");

const newPassword = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(128, "Password is too long");

export const registerSchema = z
  .object({
    fullName,
    email,
    phone,
    password: z
      .string()
      .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters`)
      .max(128, "Password is too long"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
export type RegisterInput = z.input<typeof registerSchema>;
export type RegisterData = z.output<typeof registerSchema>;

/** What a signed-in person can change about themselves. */
export const profileSchema = z.object({ fullName, phone });
export type ProfileInput = z.input<typeof profileSchema>;
export type ProfileData = z.output<typeof profileSchema>;

export const forgotPasswordSchema = z.object({ email });
export type ForgotPasswordInput = z.input<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({ password: newPassword, confirmPassword: z.string().min(1, "Confirm your password") })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
export type ResetPasswordInput = z.input<typeof resetPasswordSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    password: newPassword,
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  })
  .refine((data) => data.password !== data.currentPassword, {
    path: ["password"],
    message: "Choose a password different from your current one",
  });
export type ChangePasswordInput = z.input<typeof changePasswordSchema>;
