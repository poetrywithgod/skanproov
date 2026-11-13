import Link from "next/link";
import type { BatchListItem } from "@/lib/manufacturer/batch-shared";
import { batchCode } from "@/lib/manufacturer/batch-shared";
import { site } from "@/lib/site";
import { formatDate, formatNumber } from "../products/bits";
import { BATCH_LABEL, BATCH_PILL, batchState } from "../products/batch-table";

/** Every batch of the manufacturer. Each row opens the batch. */
export function BatchesTable({ batches }: { batches: BatchListItem[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] text-left text-[15px]">
        <thead>
          <tr className="bg-[#f7f8f7] text-xs font-semibold text-body">
            <th scope="col" className="px-6 py-3.5">Batch number</th>
            <th scope="col" className="px-3 py-3.5">Product</th>
            <th scope="col" className="px-3 py-3.5">Production date</th>
            <th scope="col" className="px-3 py-3.5">Expiry date</th>
            <th scope="col" className="px-3 py-3.5">Codes generated</th>
            <th scope="col" className="px-6 py-3.5">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-row-line">
          {batches.map((batch) => {
            const state = batchState(batch);
            return (
              <tr key={batch.id}>
                <td className="px-6 py-4">
                  <Link href={`${site.manufacturer.batches}/${batch.id}`} className="font-semibold text-ink hover:text-retail hover:underline">
                    {batch.batchNumber}
                  </Link>
                  <p className="text-xs text-muted">{batchCode(batch.batchNo)}</p>
                </td>
                <td className="px-3 py-4 text-body">{[batch.productName, batch.variant].filter(Boolean).join(" · ")}</td>
                <td className="px-3 py-4 text-body">{formatDate(batch.manufacturedOn)}</td>
                <td className="px-3 py-4 text-muted">{formatDate(batch.expiresOn)}</td>
                <td className="px-3 py-4 text-[13px] text-ink">
                  {formatNumber(batch.codesGenerated)}
                  {batch.units ? ` / ${formatNumber(batch.units)}` : ""}
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
