import { ClockIcon } from "@/components/app/app-icons";
import type { RetailerContext } from "@/lib/retailer/data";

/** Explains why scanning is off while no branch is approved. Null when scanning works. */
export function branchNotice(shop: RetailerContext): { title: string; body: string } | null {
  if (shop.activeBranch) return null;
  const rejected = shop.branches.length > 0 && shop.branches.every((b) => b.status === "rejected");
  return rejected
    ? {
        title: "Your branch was not approved",
        body: "SKANPROOV could not approve your branch details. Contact support through the Help Center to sort it out.",
      }
    : {
        title: "Waiting for approval",
        body: `${shop.branches[0]?.name ?? "Your branch"} will be able to receive cartons once SKANPROOV approves it. We will show it here as soon as that happens.`,
      };
}

export function PendingNotice({ title, body }: { title: string; body: string }) {
  return (
    <div role="status" className="flex gap-3 rounded-2xl bg-[#fdf0dc] p-4 text-[#7a4a05]">
      <ClockIcon className="mt-0.5 size-5 shrink-0" />
      <div>
        <p className="text-[15px] font-bold">{title}</p>
        <p className="mt-1 text-[13px] leading-[1.5]">{body}</p>
      </div>
    </div>
  );
}
