"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { disconnectManufacturerAction } from "@/app/retailer/actions";

function ConfirmSubmit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-11 w-full rounded-xl bg-danger text-[15px] font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger disabled:opacity-70"
    >
      {pending ? "Disconnecting…" : "Disconnect"}
    </button>
  );
}

/** Asks first, because cartons from a manufacturer you are not connected to are held for investigation. */
export function DisconnectButton({ manufacturerId, name }: { manufacturerId: string; name: string }) {
  const [asking, setAsking] = useState(false);

  if (!asking) {
    return (
      <button
        type="button"
        onClick={() => setAsking(true)}
        className="mx-auto block h-11 px-4 text-[15px] font-semibold text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger"
      >
        Disconnect
      </button>
    );
  }

  return (
    <div role="alertdialog" aria-label={`Disconnect from ${name}`} className="rounded-2xl border border-line bg-white p-4">
      <p className="text-[15px] font-bold text-ink">Disconnect from {name}?</p>
      <p className="mt-1 text-[13px] leading-[1.5] text-body">
        Their cartons will be held for investigation when you scan them, until you connect again.
      </p>
      <div className="mt-3 flex gap-2.5">
        <button
          type="button"
          onClick={() => setAsking(false)}
          className="h-11 flex-1 rounded-xl border border-line bg-white text-[15px] font-semibold text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail"
        >
          Keep connected
        </button>
        <form action={disconnectManufacturerAction} className="flex-1">
          <input type="hidden" name="manufacturerId" value={manufacturerId} />
          <ConfirmSubmit />
        </form>
      </div>
    </div>
  );
}
