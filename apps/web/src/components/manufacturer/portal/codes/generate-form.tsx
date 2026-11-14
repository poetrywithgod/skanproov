"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { CODE_FORMATS, CODE_FORMAT_LABELS, CODE_RUN_MAX, runCode, type CodeFormat } from "@skanproov/validation";
import { generateCodesAction } from "@/app/manufacturer/(portal)/code-management/actions";
import { Field, controlClass } from "@/components/manufacturer/form-bits";

export interface GenerateBatch {
  id: string;
  batchNumber: string;
  units: number;
  generated: number;
}
export interface GenerateProduct {
  id: string;
  name: string;
  variant: string | null;
  batches: GenerateBatch[];
}

const nf = (n: number) => n.toLocaleString("en-US");

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  );
}

/** Choose a product and batch, say how many codes, and generate them. The summary card follows the choices. */
export function GenerateForm({ products, initialBatchId }: { products: GenerateProduct[]; initialBatchId?: string }) {
  const router = useRouter();
  const start = products.find((p) => p.batches.some((b) => b.id === initialBatchId)) ?? products[0];
  const [productId, setProductId] = useState(start?.id ?? "");
  const [batchId, setBatchId] = useState(start?.batches.find((b) => b.id === initialBatchId)?.id ?? start?.batches[0]?.id ?? "");
  const [quantity, setQuantity] = useState("");
  const [format, setFormat] = useState<CodeFormat>("qr_pin");
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const product = products.find((p) => p.id === productId);
  const batch = product?.batches.find((b) => b.id === batchId);
  const available = batch ? Math.max(0, batch.units - batch.generated) : 0;
  const capped = Math.min(available, CODE_RUN_MAX);
  const shownQuantity = quantity === "" ? capped : Number.parseInt(quantity.replace(/,/g, ""), 10) || 0;
  const summary = useMemo(() => CODE_FORMAT_LABELS[format].summary, [format]);

  function chooseProduct(id: string) {
    const next = products.find((p) => p.id === id);
    setProductId(id);
    setBatchId(next?.batches[0]?.id ?? "");
    setQuantity("");
    setErrors({});
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setDone(null);
    setErrors({});
    setPending(true);
    try {
      const result = await generateCodesAction({ batchId, quantity: shownQuantity, format });
      if (result.ok) {
        setDone(`${runCode(result.runNo)}: ${nf(result.quantity)} codes generated. Your files are ready under Recent generations.`);
        setQuantity("");
        router.refresh();
        return;
      }
      setErrors(result.fields ?? {});
      setFormError(result.message ?? null);
    } catch {
      setFormError("Something went wrong. Nothing was created, so please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="rounded-xl border border-line bg-white" aria-label="Code details">
        <div className="border-b border-row-line px-6 py-5">
          <h2 className="text-lg font-semibold text-ink">Code details</h2>
          <p className="mt-0.5 text-sm text-muted">Select a product and batch, then configure your codes.</p>
        </div>
        <div className="space-y-6 px-6 py-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Product *">
              {({ id }) => (
                <select id={id} value={productId} onChange={(e) => chooseProduct(e.target.value)} className={`${controlClass} border-field-border`}>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {[p.name, p.variant].filter(Boolean).join(" · ")}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <Field label="Batch *" error={errors.batchId}>
              {({ id, invalid, describedBy }) => (
                <select
                  id={id}
                  value={batchId}
                  onChange={(e) => {
                    setBatchId(e.target.value);
                    setQuantity("");
                  }}
                  aria-invalid={invalid}
                  aria-describedby={describedBy}
                  className={`${controlClass} ${errors.batchId ? "border-danger" : "border-field-border"}`}
                >
                  {(product?.batches ?? []).map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.batchNumber}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          </div>

          <dl className="grid grid-cols-3 gap-4 rounded-lg bg-surface-soft px-5 py-4 text-sm">
            <div>
              <dt className="text-xs text-muted">Batch size</dt>
              <dd className="mt-1 font-semibold text-ink">{batch ? `${nf(batch.units)} units` : "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Already generated</dt>
              <dd className="mt-1 font-semibold text-ink">{batch ? nf(batch.generated) : "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Available for generation</dt>
              <dd className="mt-1 font-semibold text-retail">{batch ? `${nf(available)} codes` : "—"}</dd>
            </div>
          </dl>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Field label="Number of codes *" error={errors.quantity}>
                {({ id, invalid, describedBy }) => (
                  <input
                    id={id}
                    inputMode="numeric"
                    autoComplete="off"
                    value={quantity === "" ? (capped ? nf(capped) : "") : quantity}
                    onChange={(e) => setQuantity(e.target.value.replace(/[^\d,]/g, ""))}
                    aria-invalid={invalid}
                    aria-describedby={describedBy}
                    className={`${controlClass} ${errors.quantity ? "border-danger" : "border-field-border"}`}
                  />
                )}
              </Field>
              <p className="mt-2 text-[13px] text-muted">
                One unique code per product unit. Up to {nf(CODE_RUN_MAX)} at a time.
              </p>
            </div>
            <div>
              <p className="mb-2.5 block text-base text-ink">Download format</p>
              <div className={`${controlClass} flex items-center border-field-border bg-surface-soft`}>CSV + label PDF</div>
              <p className="mt-2 text-[13px] text-muted">Export data and print-ready QR labels.</p>
            </div>
          </div>

          <fieldset>
            <legend className="mb-3 text-base text-ink">Verification format</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              {CODE_FORMATS.map((value) => (
                <label
                  key={value}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3.5 ${format === value ? "border-retail bg-retail-soft" : "border-field-border bg-white"}`}
                >
                  <input type="radio" name="format" value={value} checked={format === value} onChange={() => setFormat(value)} className="mt-1 accent-[#0e6b4f]" />
                  <span>
                    <span className="block text-[15px] font-medium text-ink">{CODE_FORMAT_LABELS[value].title}</span>
                    <span className="block text-[13px] text-muted">{CODE_FORMAT_LABELS[value].note}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <p className="rounded-lg bg-retail-soft px-4 py-3 text-[13px] leading-relaxed text-body">
            New codes start inactive. They begin to verify when you release the batch at dispatch, so nothing verifies before the products are out.
          </p>
        </div>
      </section>

      <aside className="rounded-xl border border-line bg-white p-6" aria-label="Generation summary">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5 text-retail" aria-hidden="true">
            <path d="M12 3 4.5 6v5.5c0 4.5 3 8 7.5 9.5 4.5-1.5 7.5-5 7.5-9.5V6L12 3Z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
          Generation summary
        </h2>
        <div className="mt-4 rounded-lg bg-retail-soft px-5 py-4">
          <p className="text-[34px] font-semibold leading-none text-retail-dark">{nf(shownQuantity)}</p>
          <p className="mt-2 text-sm text-body">unique verification codes</p>
        </div>
        <dl className="mt-5 space-y-3.5">
          <Row label="Product" value={product?.name ?? "—"} />
          <Row label="Batch" value={batch?.batchNumber ?? "—"} />
          <Row label="Code format" value={summary} />
          <Row label="Download" value="CSV + label PDF" />
          <Row label="Initial status" value={<span className="rounded-full bg-warn-soft px-3 py-0.5 text-[13px] text-warn">Inactive</span>} />
        </dl>

        {formError ? (
          <p role="alert" className="mt-5 rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger">
            {formError}
          </p>
        ) : null}
        {done ? (
          <p role="status" className="mt-5 rounded-lg bg-retail-soft px-4 py-3 text-sm text-retail-dark">
            {done}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending || !batch || available === 0}
          className="mt-5 flex h-14 w-full items-center justify-center rounded-xl bg-retail text-[15px] font-semibold text-white transition hover:bg-retail-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Generating… this can take a few seconds" : "Generate Codes"}
        </button>
        <p className="mt-3 text-center text-xs text-muted">Securely generated. No duplicate codes.</p>
      </aside>
    </form>
  );
}
