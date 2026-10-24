export type ProductDetail = { label: string; value: string };

export const sampleProduct: ProductDetail[] = [
  { label: "Product", value: "ABC Premium" },
  { label: "Manufacturer", value: "ABC Nigeria Ltd" },
  { label: "Batch", value: "BTH-02491" },
];

export function ProductDetails({ rows = sampleProduct }: { rows?: ProductDetail[] }) {
  return (
    <dl className="divide-y divide-line text-xs">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between gap-4 py-2">
          <dt className="text-muted">{row.label}</dt>
          <dd className="font-semibold text-ink">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
