import Link from "next/link";

/** "Showing 1–6 of 6 products" with Previous, page numbers and Next. Plain links, so it works without scripts. */
export function Pagination({
  page,
  pageCount,
  from,
  to,
  total,
  hrefFor,
}: {
  page: number;
  pageCount: number;
  from: number;
  to: number;
  total: number;
  hrefFor: (page: number) => string;
}) {
  const link = "rounded-lg px-3 py-1.5 text-sm font-medium";
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-row-line px-6 py-4 text-[13px] text-body">
      <p>
        Showing {from}–{to} of {total} {total === 1 ? "product" : "products"}
      </p>
      <nav aria-label="Pages" className="flex items-center gap-1">
        {page > 1 ? (
          <Link href={hrefFor(page - 1)} className={`${link} text-body hover:bg-pill`}>
            Previous
          </Link>
        ) : (
          <span className={`${link} text-muted`}>Previous</span>
        )}
        {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
          <Link
            key={n}
            href={hrefFor(n)}
            aria-current={n === page ? "page" : undefined}
            className={`${link} ${n === page ? "bg-retail-soft font-semibold text-retail-dark" : "text-body hover:bg-pill"}`}
          >
            {n}
          </Link>
        ))}
        {page < pageCount ? (
          <Link href={hrefFor(page + 1)} className={`${link} text-body hover:bg-pill`}>
            Next
          </Link>
        ) : (
          <span className={`${link} text-muted`}>Next</span>
        )}
      </nav>
    </div>
  );
}
