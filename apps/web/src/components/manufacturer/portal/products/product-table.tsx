import Link from "next/link";
import type { ProductListItem } from "@/lib/manufacturer/product-shared";
import { site } from "@/lib/site";
import { ProductThumb, StatusPill } from "./bits";

function subtitle(product: ProductListItem): string {
  return [product.variant, product.packSize].filter(Boolean).join(" · ");
}

function actionFor(product: ProductListItem): { label: string; href: string } {
  const base = `${site.manufacturer.products}/${product.id}`;
  return product.status === "draft" ? { label: "Complete setup", href: `${base}/edit` } : { label: "View details", href: base };
}

/** The products of one page. A table from tablet width up, stacked cards on a phone. */
export function ProductTable({ products }: { products: ProductListItem[] }) {
  return (
    <>
      <ul className="divide-y divide-row-line md:hidden">
        {products.map((product) => {
          const action = actionFor(product);
          return (
            <li key={product.id} className="px-5 py-4">
              <div className="flex items-start gap-3">
                <ProductThumb path={product.imagePath} name={product.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <Link href={`${site.manufacturer.products}/${product.id}`} className="block font-semibold text-ink hover:text-retail hover:underline">
                    {product.name}
                  </Link>
                  <p className="text-[13px] text-muted">{subtitle(product) || "No details yet"}</p>
                  <p className="text-[13px] text-muted">
                    {product.sku ?? "No SKU"}
                    {product.category ? ` · ${product.category}` : ""}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <StatusPill status={product.status} />
                <div className="flex items-center gap-4 text-[13px] font-semibold text-retail">
                  <Link href={`${site.manufacturer.products}/${product.id}#batches`} className="hover:underline">
                    {product.batchCount} {product.batchCount === 1 ? "batch" : "batches"}
                  </Link>
                  <Link href={action.href} className="hover:underline">
                    {action.label}
                  </Link>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="hidden overflow-x-auto md:block">
      <table className="w-full min-w-[640px] text-left text-[15px]">
        <thead>
          <tr className="bg-[#f7f8f7] text-xs font-semibold text-body">
            <th scope="col" className="px-6 py-3.5">Product</th>
            <th scope="col" className="hidden px-3 py-3.5 lg:table-cell">Product SKU</th>
            <th scope="col" className="hidden px-3 py-3.5 lg:table-cell">Category</th>
            <th scope="col" className="px-3 py-3.5">Registration status</th>
            <th scope="col" className="px-6 py-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-row-line">
          {products.map((product) => {
            const action = actionFor(product);
            return (
              <tr key={product.id} className="hover:bg-[#fbfcfb]">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <ProductThumb path={product.imagePath} name={product.name} size="sm" />
                    <div className="min-w-0">
                      <Link href={`${site.manufacturer.products}/${product.id}`} className="block truncate font-semibold text-ink hover:text-retail hover:underline">
                        {product.name}
                      </Link>
                      <p className="truncate text-[13px] text-muted">{subtitle(product) || "No details yet"}</p>
                      <p className="text-[13px] text-muted lg:hidden">{product.sku ?? "No SKU"}</p>
                    </div>
                  </div>
                </td>
                <td className="hidden px-3 py-4 text-body lg:table-cell">{product.sku ?? "—"}</td>
                <td className="hidden px-3 py-4 text-muted lg:table-cell">{product.category ?? "—"}</td>
                <td className="px-3 py-4">
                  <StatusPill status={product.status} />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-5 whitespace-nowrap">
                    <Link href={`${site.manufacturer.products}/${product.id}#batches`} className="text-right text-[13px] font-semibold text-retail hover:underline">
                      View Batches
                      <span className="block text-xs font-normal text-muted">
                        {product.batchCount} {product.batchCount === 1 ? "batch" : "batches"}
                      </span>
                    </Link>
                    <Link href={action.href} className="text-[13px] font-semibold text-retail hover:underline">
                      {action.label}
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </>
  );
}
