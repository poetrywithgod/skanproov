import type { Metadata } from "next";
import { connectManufacturerAction, disconnectManufacturerAction } from "@/app/retailer/actions";
import { FactoryIcon } from "@/components/retailer/icons";
import { getManufacturers } from "@/lib/retailer/data";
import { formatDateTime } from "@/lib/retailer/format";

export const metadata: Metadata = { title: "Manufacturers", robots: { index: false } };

export default async function ManufacturersPage() {
  const manufacturers = await getManufacturers();
  const connected = manufacturers.filter((m) => m.connected).length;

  return (
    <div className="space-y-4 px-4 pb-4 pt-5">
      <header>
        <h1 className="text-2xl font-bold tracking-normal text-ink">Manufacturers</h1>
        <p className="mt-1 text-[13px] leading-[1.5] text-body">
          Connect to the manufacturers you buy from. Connecting is instant, and you can disconnect at any time. Cartons from a
          manufacturer you are not connected to are held for investigation.
        </p>
      </header>

      {manufacturers.length === 0 ? (
        <p className="rounded-2xl bg-white p-5 text-center text-sm text-body shadow-[0_1px_4px_rgba(15,31,23,0.06)]">
          No manufacturers are on SKANPROOV yet.
        </p>
      ) : (
        <>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{connected} connected</p>
          <ul className="space-y-2.5">
            {manufacturers.map((m) => (
              <li key={m.id} className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-[0_1px_4px_rgba(15,31,23,0.06)]">
                <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-[#e6eee8] text-body">
                  <FactoryIcon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold text-ink">{m.name}</p>
                  <p className="text-xs text-muted">
                    {m.connected && m.connectedAt ? `Connected ${formatDateTime(m.connectedAt)}` : "Not connected"}
                  </p>
                </div>
                <form action={m.connected ? disconnectManufacturerAction : connectManufacturerAction}>
                  <input type="hidden" name="manufacturerId" value={m.id} />
                  <button
                    type="submit"
                    className={`h-9 rounded-lg px-4 text-[13px] font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                      m.connected ? "border border-line-strong bg-white text-ink" : "bg-brand text-white hover:bg-brand-dark"
                    }`}
                  >
                    {m.connected ? "Disconnect" : "Connect"}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
