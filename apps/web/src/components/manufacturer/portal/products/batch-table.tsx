import Link from "next/link";
import { site } from "@/lib/site";
import type { ProductBatch } from "@/lib/manufacturer/product-shared";
import { formatDate, formatNumber } from "./bits";

export type BatchState = "active" | "expired" | "recalled" | "revoked";

/** A batch is Active until it is recalled, revoked or past its expiry date. */
export function batchState(batch: { status: "active" | "recalled" | "revoked"; expiresOn: string | null }, today = new Date()): BatchState {
  if (batch.status !== "active") return batch.status;
  if (batch.expiresOn && new Date(`${batch.expiresOn}T23:59:59`) < today) return "expired";
  return "active";
}

export const BATCH_LABEL: Record<BatchState, string> = { active: "Active", expired: "Expired", recalled: "Recalled", revoked: "Revoked" };
export const BATCH_PILL: Record<BatchState, string> = {
  active: "bg-retail-soft text-retail-dark",
  expired: "bg-pill text-muted",
  recalled: "bg-danger-soft text-danger",
  revoked: "bg-danger-soft text-danger",
};

/** The production batches of one product. Each batch opens its own page. */
export function BatchTable({ batches }: { batches: ProductBatch[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-[15px]">
        <thead>
          <tr className="bg-[#f7f8f7] text-xs font-semibold text-body">
            <th scope="col" className="px-6 py-3.5">Batch number</th>
            <th scope="col" className="px-3 py-3.5">Production date</th>
            <th scope="col" className="px-3 py-3.5">Expiry date</th>
            <th scope="col" className="px-3 py-3.5">Units</th>
            <th scope="col" className="px-3 py-3.5">Codes generated</th>
            <th scope="col" className="px-6 py-3.5">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-row-line">
          {batches.map((batch) => {
            const state = batchState(batch);
            const percent = batch.units ? Math.min(100, Math.round((batch.codesGenerated / batch.units) * 100)) : null;
            const remaining = batch.units ? Math.max(0, batch.units - batch.codesGenerated) : null;
            return (
              <tr key={batch.id}>
                <td className="px-6 py-4 font-semibold text-ink"><Link href={`${site.manufacturer.batches}/${batch.id}`} className="hover:text-retail hover:underline">{batch.batchNumber}</Link></td>
                <td className="px-3 py-4 text-body">{formatDate(batch.manufacturedOn)}</td>
                <td className="px-3 py-4 text-muted">{formatDate(batch.expiresOn)}</td>
                <td className="px-3 py-4 text-body">{batch.units ? formatNumber(batch.units) : "—"}</td>
                <td className="px-3 py-4">
                  <p className="text-[13px] text-ink">
                    {formatNumber(batch.codesGenerated)}
                    {batch.units ? ` / ${formatNumber(batch.units)}` : ""}
                  </p>
                  {percent !== null ? (
                    <div className="mt-1.5 h-1 w-36 overflow-hidden rounded-full bg-track" role="img" aria-label={`${percent}% of codes generated`}>
                      <div className="h-full rounded-full bg-retail" style={{ width: `${percent}%` }} />
                    </div>
                  ) : null}
                  {remaining !== null ? (
                    <p className="mt-1 text-xs text-retail">{remaining > 0 ? `${formatNumber(remaining)} available` : <span className="text-muted">Fully generated</span>}</p>
                  ) : null}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-medium ${BATCH_PILL[state]}`}>
                    <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
                    {BATCH_LABEL[state]}
                  </span>
                  <p className="mt-1 text-xs text-muted">{batch.releasedAt ? "Released" : "Not released yet"}</p>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
