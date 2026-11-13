import Link from "next/link";
import { site } from "@/lib/site";
import { ChevronIcon } from "../icons";

/** "Batches > Declare batch": the earlier step links back, the current one is green. */
export function BatchesBreadcrumb({ current, parent }: { current: string; parent?: { label: string; href: string } }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted">
      <Link href={site.manufacturer.batches} className="hover:text-ink hover:underline">
        Batches
      </Link>
      {parent ? (
        <>
          <ChevronIcon className="size-3.5 rotate-180" />
          <Link href={parent.href} className="hover:text-ink hover:underline">
            {parent.label}
          </Link>
        </>
      ) : null}
      <ChevronIcon className="size-3.5 rotate-180" />
      <span aria-current="page" className="font-medium text-retail">
        {current}
      </span>
    </nav>
  );
}

export function DeclareBatchButton({ productId }: { productId?: string }) {
  return (
    <Link
      href={productId ? `${site.manufacturer.batches}/new?product=${productId}` : `${site.manufacturer.batches}/new`}
      className="inline-flex h-12 items-center gap-2 rounded-xl bg-retail px-5 text-[15px] font-semibold text-white transition hover:bg-retail-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail"
    >
      <span aria-hidden="true" className="text-xl leading-none">
        +
      </span>
      Declare Batch
    </Link>
  );
}
