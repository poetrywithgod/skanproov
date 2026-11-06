import type { ComponentType, SVGProps } from "react";
import { UserCircleIcon } from "@/components/app/app-icons";
import type { RoleId } from "@/lib/roles";
import { FactoryIcon, StoreIcon } from "./retailer/icons";

const ICONS: Record<RoleId, ComponentType<SVGProps<SVGSVGElement>>> = {
  manufacturer: FactoryIcon,
  retailer: StoreIcon,
  consumer: UserCircleIcon,
};

/** Icon in a soft green tile, used wherever a person picks a role. */
export function RoleIcon({ role, className = "size-10" }: { role: RoleId; className?: string }) {
  const Icon = ICONS[role];
  return (
    <span className={`grid shrink-0 place-items-center rounded-xl bg-brand-soft text-brand ${className}`}>
      <Icon className="size-5" />
    </span>
  );
}
