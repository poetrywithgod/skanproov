"use client";

import { useFormStatus } from "react-dom";
import { connectManufacturerAction } from "@/app/retailer/actions";

function Submit({ className }: { className: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? "Connecting…" : "Connect"}
    </button>
  );
}

/** Connects to a manufacturer straight away. No approval is needed. */
export function ConnectButton({
  manufacturerId,
  size = "md",
}: {
  manufacturerId: string;
  size?: "md" | "lg";
}) {
  return (
    <form action={connectManufacturerAction} className={size === "md" ? "flex-1" : "w-full"}>
      <input type="hidden" name="manufacturerId" value={manufacturerId} />
      <Submit
        className={`flex w-full items-center justify-center bg-retail font-semibold text-white transition-colors hover:bg-retail-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail disabled:opacity-70 ${
          size === "lg" ? "h-14 rounded-2xl text-base" : "h-11 rounded-xl text-[15px]"
        }`}
      />
    </form>
  );
}
