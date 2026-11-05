"use client";

import { useFormStatus } from "react-dom";
import { markReceivedAction } from "@/app/retailer/actions";
import { BoxIcon } from "./icons";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-retail text-base font-semibold text-white transition-colors hover:bg-retail-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail disabled:opacity-70"
    >
      <BoxIcon className="size-5" />
      {pending ? "Confirming…" : "Confirm receipt"}
    </button>
  );
}

/** Adds the carton to the retailer's stock records. */
export function ConfirmReceipt({ scanId }: { scanId: string }) {
  return (
    <form action={markReceivedAction}>
      <input type="hidden" name="scanId" value={scanId} />
      <Submit />
    </form>
  );
}
