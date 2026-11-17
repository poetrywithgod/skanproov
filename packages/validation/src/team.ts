import { z } from "zod";

export const TEAM_ROLES = ["admin", "code_manager", "compliance_officer", "viewer"] as const;
export const teamRoleSchema = z.enum(TEAM_ROLES, { error: "Choose a role" });

/** Inviting someone to the team (Team Management, "Invite member"). */
export const inviteMemberSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Enter the person's full name")
    .max(120, "Keep the name under 120 characters"),
  email: z
    .string()
    .trim()
    .min(1, "Enter the person's e-mail address")
    .max(254, "E-mail address is too long")
    .pipe(z.email("Enter a valid e-mail address"))
    .transform((value) => value.toLowerCase()),
  role: teamRoleSchema,
});
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
