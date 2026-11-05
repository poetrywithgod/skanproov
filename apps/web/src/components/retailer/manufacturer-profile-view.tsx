import Link from "next/link";
import { BadgeCheckIcon, ChevronLeftIcon } from "@/components/app/app-icons";
import { ScanIcon } from "@/components/icons";
import type { ManufacturerProfile } from "@/lib/retailer/data";
import { formatDateTime } from "@/lib/retailer/format";
import { site } from "@/lib/site";
import { ConnectButton } from "./connect-button";
import { DisconnectButton } from "./disconnect-button";
import { ManufacturerAvatar } from "./manufacturer-avatar";

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-start justify-between gap-5 border-t border-row-line px-4 py-3.5 text-[15px] leading-[1.4]">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className={`text-right ${value ? "font-semibold text-ink" : "text-muted"}`}>{value ?? "Not provided"}</dd>
    </div>
  );
}

/** What a retailer checks before connecting: is this the right company? */
export function ManufacturerProfileView({ profile }: { profile: ManufacturerProfile }) {
  const list = (items: string[]) => (items.length > 0 ? items.join(", ") : null);

  return (
    <div>
      <header className="flex h-14 items-center gap-1 border-b border-line bg-white px-2">
        <Link
          href={site.retailer.manufacturers}
          aria-label="Back to manufacturers"
          className="grid size-10 place-items-center rounded-full text-ink hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-retail"
        >
          <ChevronLeftIcon className="size-6" />
        </Link>
        <h1 className="text-[17px] font-bold tracking-normal text-ink">Manufacturer profile</h1>
      </header>

      <div className="space-y-4 px-4 pt-5">
        <div className="flex items-center gap-3.5">
          <ManufacturerAvatar name={profile.name} size="lg" />
          <div className="min-w-0">
            <h2 className="text-2xl font-extrabold leading-8 tracking-[-0.03em] text-ink">{profile.name}</h2>
            {profile.verified ? (
              <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-retail">
                <BadgeCheckIcon className="size-[18px] shrink-0" />
                Business verified by SkanProof
              </p>
            ) : null}
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-line bg-white" aria-labelledby="check-heading">
          <h3 id="check-heading" className="px-4 py-3.5 text-[15px] font-bold tracking-normal text-ink">
            Check this is the right manufacturer
          </h3>
          <dl>
            <Row label="Registered name" value={profile.registeredName} />
            <Row label="RC number" value={profile.rcNumber} />
            <Row label="Address" value={profile.address} />
            <Row label="Categories" value={list(profile.categories)} />
            <Row label="Brands" value={list(profile.brands)} />
            <Row label="Contact" value={profile.contactEmail} />
          </dl>
        </section>

        <p className="px-2 text-center text-[13px] leading-[1.5] text-body">
          {profile.connected && profile.connectedAt
            ? `You connected on ${formatDateTime(profile.connectedAt)}. Their cartons verify when you scan them.`
            : "Once you connect, their cartons will verify when you scan them."}
        </p>
      </div>

      <div className="mt-6 space-y-3 border-t border-line px-4 pt-5">
        {profile.connected ? (
          <>
            <Link
              href={site.retailer.scan}
              className="flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-retail text-base font-semibold text-white transition-colors hover:bg-retail-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail"
            >
              <ScanIcon className="size-5" />
              Scan their cartons
            </Link>
            <DisconnectButton manufacturerId={profile.id} name={profile.name} />
          </>
        ) : (
          <ConnectButton manufacturerId={profile.id} size="lg" />
        )}
      </div>
    </div>
  );
}
