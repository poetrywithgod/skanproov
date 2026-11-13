import Link from "next/link";
import { site } from "@/lib/site";
import { BatchesIcon, CodesIcon, ProductsIcon } from "../icons";

const STEPS = [
  { icon: ProductsIcon, title: "Add your product", text: "Enter product details, add a SKU and upload a clear product image." },
  { icon: BatchesIcon, title: "Declare a batch", text: "Once registered, add production dates, expiry dates and unit quantities." },
  { icon: CodesIcon, title: "Generate codes", text: "Create unique authentication codes for the units in each batch." },
] as const;

/** "Your product journey starts here": a manufacturer with no products yet. */
export function ProductsEmptyState() {
  return (
    <section className="mt-6 rounded-xl border border-line bg-white" aria-label="All products">
      <div className="flex items-baseline gap-3 border-b border-row-line px-6 py-5">
        <h2 className="text-lg font-semibold text-ink">All products</h2>
        <span className="text-[13px] text-muted">0 products</span>
      </div>

      <div className="px-6 py-14 text-center">
        <div className="mx-auto grid size-[120px] place-items-center rounded-full bg-retail-soft/60">
          <span className="relative grid size-[84px] place-items-center rounded-2xl border border-line bg-white text-retail">
            <ProductsIcon className="size-10" />
            <span aria-hidden="true" className="absolute -bottom-2 -right-2 grid size-7 place-items-center rounded-full bg-retail text-lg leading-none text-white">
              +
            </span>
          </span>
        </div>
        <h3 className="mt-6 text-2xl font-semibold tracking-tight text-ink">Your product journey starts here</h3>
        <p className="mx-auto mt-3 max-w-lg text-base leading-relaxed text-body">
          You haven&rsquo;t added any products yet. Add your first product to register it, declare production batches and protect every unit with authentication codes.
        </p>
        <Link
          href={`${site.manufacturer.products}/new`}
          className="mt-6 inline-flex h-12 items-center gap-2 rounded-xl bg-retail px-6 text-[15px] font-semibold text-white transition hover:bg-retail-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail"
        >
          <span aria-hidden="true" className="text-xl leading-none">+</span>
          Add Product
        </Link>
        <p className="mt-3 text-[13px] text-muted">Have your product name, SKU and product image ready.</p>
      </div>

      <div className="border-t border-row-line bg-[#fafbfa] px-6 py-6">
        <h3 className="text-sm font-semibold text-ink">From product registration to product protection</h3>
        <ol className="mt-4 grid gap-5 md:grid-cols-3">
          {STEPS.map(({ icon: StepIcon, title, text }) => (
            <li key={title}>
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-lg bg-retail-soft text-retail">
                  <StepIcon className="size-[18px]" />
                </span>
                <p className="text-sm font-semibold text-ink">{title}</p>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted">{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
