import type { ProductStatus } from "@skanproov/validation";
import { PRODUCT_STATUS_LABELS } from "@skanproov/validation";
import Link from "next/link";
import type { ReactNode } from "react";
import { productImageUrl } from "@/lib/manufacturer/product-shared";
import { site } from "@/lib/site";
import { ChevronIcon, ProductsIcon } from "../icons";

export function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}

const PILL: Record<ProductStatus, string> = {
  registered: "bg-retail-soft text-retail-dark",
  pending_review: "bg-warn-soft text-warn",
  draft: "bg-pill text-muted",
};

export function StatusPill({ status }: { status: ProductStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-medium ${PILL[status]}`}>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {PRODUCT_STATUS_LABELS[status]}
    </span>
  );
}

/** The product picture, or a plain tile when it has none. */
export function ProductThumb({ path, name, size }: { path: string | null; name: string; size: "sm" | "lg" }) {
  const url = productImageUrl(path);
  const box = size === "sm" ? "size-12 rounded-lg" : "size-40 rounded-xl";
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element -- pictures come from storage, not from the app bundle
    <img src={url} alt={name} loading="lazy" className={`${box} shrink-0 bg-pill object-cover`} />
  ) : (
    <span aria-hidden="true" className={`${box} grid shrink-0 place-items-center bg-pill text-muted`}>
      <ProductsIcon className={size === "sm" ? "size-5" : "size-10"} />
    </span>
  );
}

/** "Products > Product register": the earlier steps link back, the current one is green. */
export function Breadcrumb({ current, includeProducts = true }: { current: string; includeProducts?: boolean }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted">
      {includeProducts ? (
        <>
          <Link href={site.manufacturer.products} className="hover:text-ink hover:underline">
            Products
          </Link>
          <ChevronIcon className="size-3.5 rotate-180" />
        </>
      ) : null}
      <span aria-current="page" className="font-medium text-retail">
        {current}
      </span>
    </nav>
  );
}

export function PageHeading({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) {
  return (
    <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-[30px] font-semibold leading-tight tracking-tight text-ink">{title}</h1>
        <p className="mt-1 text-base text-body">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

export function AddProductButton() {
  return (
    <Link
      href={`${site.manufacturer.products}/new`}
      className="inline-flex h-12 items-center gap-2 rounded-xl bg-retail px-5 text-[15px] font-semibold text-white transition hover:bg-retail-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail"
    >
      <span aria-hidden="true" className="text-xl leading-none">
        +
      </span>
      Add Product
    </Link>
  );
}

export function StatCard({ value, title, note }: { value: ReactNode; title: string; note: string }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-line bg-white px-5 py-5">
      <span className="text-[34px] font-medium leading-none text-ink">{value}</span>
      <div>
        <p className="text-[15px] font-semibold text-ink">{title}</p>
        <p className="text-xs text-muted">{note}</p>
      </div>
    </div>
  );
}

export function InfoNote({ children }: { children: ReactNode }) {
  return (
    <p className="mt-5 flex items-center gap-2 text-[13px] text-body">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4 shrink-0 text-muted" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5M12 8h.01" strokeLinecap="round" />
      </svg>
      {children}
    </p>
  );
}
