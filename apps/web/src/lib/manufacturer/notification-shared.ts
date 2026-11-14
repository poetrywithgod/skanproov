export const NOTIFICATION_CATEGORIES = [
  { key: "code_generation", label: "Code generation" },
  { key: "batches", label: "Batches" },
  { key: "account", label: "Account" },
] as const;
export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number]["key"];

export interface ManufacturerNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  refLabel: string | null;
  link: string | null;
  linkLabel: string | null;
  createdAt: string;
  read: boolean;
}

export function categoryLabel(key: NotificationCategory): string {
  return NOTIFICATION_CATEGORIES.find((c) => c.key === key)?.label ?? key;
}
