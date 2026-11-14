"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type DragEvent, type FormEvent, type ReactNode } from "react";
import {
  BATCH_CERTIFICATE_BUCKET,
  BATCH_CERTIFICATE_MAX_BYTES,
  BATCH_CERTIFICATE_TYPES,
  todayInLagos,
} from "@skanproov/validation";
import { declareBatchAction } from "@/app/manufacturer/(portal)/batches/actions";
import { Field, TextInput, controlClass } from "@/components/manufacturer/form-bits";
import type { BatchProductOption } from "@/lib/manufacturer/batch-shared";
import { createClient } from "@/lib/supabase/browser";
import { site } from "@/lib/site";
import { formatDate } from "../products/bits";

const EXTENSIONS: Record<string, string> = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png" };

function Card({ step, title, note, children }: { step: string; title: string; note: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-white p-6 sm:p-7" aria-label={title}>
      <div className="flex items-start gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-retail-soft text-[13px] font-semibold text-retail-dark">{step}</span>
        <div>
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          <p className="text-sm text-muted">{note}</p>
        </div>
      </div>
      <div className="mt-6 space-y-5">{children}</div>
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  );
}

const NEXT_STEPS = [
  { title: "Batch is registered", text: "Your declaration is saved to Batches with a unique batch record." },
  { title: "Generate your codes", text: "Create traceable codes for the packs in this batch from Code Management." },
  { title: "Release at dispatch", text: "Codes start to verify when you release the batch, once the products are out." },
];

/** Declare a production batch for one of the manufacturer's registered products. */
export function BatchForm({ manufacturerId, products, productId }: { manufacturerId: string; products: BatchProductOption[]; productId?: string }) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState(productId ?? "");
  const [batchNumber, setBatchNumber] = useState("");
  const [units, setUnits] = useState("");
  const [made, setMade] = useState("");
  const [expires, setExpires] = useState("");
  const [facility, setFacility] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [certificate, setCertificate] = useState<{ path: string; name: string; size: number } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const product = products.find((p) => p.id === selected);
  const quantity = Number.parseInt(units.replace(/,/g, ""), 10);

  async function removeUploaded(path: string) {
    await createClient().storage.from(BATCH_CERTIFICATE_BUCKET).remove([path]);
  }

  async function chooseFile(file: File) {
    setFileError(null);
    if (!(BATCH_CERTIFICATE_TYPES as readonly string[]).includes(file.type)) {
      setFileError("Use a PDF, JPG or PNG file.");
      return;
    }
    if (file.size > BATCH_CERTIFICATE_MAX_BYTES) {
      setFileError("That file is too big. The limit is 5 MB.");
      return;
    }
    setUploading(true);
    const path = `${manufacturerId}/${crypto.randomUUID()}.${EXTENSIONS[file.type]}`;
    try {
      const { error } = await createClient().storage.from(BATCH_CERTIFICATE_BUCKET).upload(path, file, { contentType: file.type });
      if (error) throw error;
      if (certificate) await removeUploaded(certificate.path);
      setCertificate({ path, name: file.name, size: file.size });
    } catch {
      setFileError("We couldn't upload that file. Please try again.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void chooseFile(file);
  }

  async function dropCertificate() {
    if (certificate) await removeUploaded(certificate.path);
    setCertificate(null);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    if (!confirmed) {
      setFormError("Please confirm that the batch details are accurate.");
      return;
    }
    const form = event.currentTarget;
    const data = new FormData(form);
    setPending(true);
    try {
      const result = await declareBatchAction({
        productId: selected,
        batchNumber,
        manufacturedOn: made,
        expiresOn: expires,
        units: units.replace(/,/g, ""),
        facility,
        notes: data.get("notes"),
        certificatePath: certificate?.path ?? "",
      });
      if (result.ok) {
        router.push(`${site.manufacturer.batches}/${result.id}`);
        router.refresh();
        return;
      }
      setErrors(result.fields ?? {});
      setFormError(result.message ?? null);
      const first = Object.keys(result.fields ?? {})[0];
      if (first) form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-6">
        <Card step="01" title="Product details" note="Choose the registered product this batch belongs to.">
          <Field label="Product *" error={errors.productId}>
            {({ id, invalid, describedBy }) => (
              <select
                id={id}
                name="productId"
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                aria-invalid={invalid}
                aria-describedby={describedBy}
                className={`${controlClass} ${errors.productId ? "border-danger" : "border-field-border"}`}
              >
                <option value="" disabled>
                  Choose a registered product
                </option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {[p.name, p.variant].filter(Boolean).join(" · ")}
                  </option>
                ))}
              </select>
            )}
          </Field>
          {product ? (
            <div className="flex items-center justify-between gap-4 rounded-lg bg-surface-soft px-4 py-3.5">
              <div className="text-[13px] leading-relaxed text-body">
                <p>
                  {product.nafdacNumber ? `NAFDAC No. ${product.nafdacNumber} · ` : ""}SKU: {product.sku ?? "—"}
                </p>
                <p className="text-muted">{[product.category, product.packSize].filter(Boolean).join(" · ")}</p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 text-[13px] font-medium text-retail">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
                Registered
              </span>
            </div>
          ) : null}
        </Card>

        <Card step="02" title="Batch details" note="Enter the production information printed on your packaging.">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <TextInput label="Batch number *" name="batchNumber" value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} placeholder="PCM-261021-01" autoComplete="off" error={errors.batchNumber} />
              <p className="mt-2 text-[13px] text-muted">Use a unique batch or lot number.</p>
            </div>
            <div>
              <TextInput label="Batch quantity *" name="units" value={units} onChange={(e) => setUnits(e.target.value.replace(/[^\d,]/g, ""))} inputMode="numeric" placeholder="5,000" autoComplete="off" error={errors.units} />
              <p className="mt-2 text-[13px] text-muted">Number of packs in this batch.</p>
            </div>
            <TextInput label="Manufacturing date *" name="manufacturedOn" type="date" value={made} onChange={(e) => setMade(e.target.value)} max={todayInLagos()} error={errors.manufacturedOn} />
            <TextInput label="Expiry date" name="expiresOn" type="date" value={expires} onChange={(e) => setExpires(e.target.value)} error={errors.expiresOn} />
          </div>
          <p className="text-[13px] text-muted">The expiry date, if there is one, must be later than the manufacturing date.</p>
        </Card>

        <Card step="03" title="Production & supporting documents" note="Add the production location and any quality assurance records.">
          <TextInput label="Manufacturing facility (optional)" name="facility" value={facility} onChange={(e) => setFacility(e.target.value)} placeholder="Ikeja Production Facility, Lagos" error={errors.facility} />
          <div>
            <p className="text-base text-ink">
              Certificate of analysis <span className="text-sm text-muted">(optional)</span>
            </p>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={`mt-3 rounded-lg border border-dashed px-5 py-4 ${dragging ? "border-retail bg-retail-soft" : "border-field-border bg-surface-soft"}`}
            >
              <button type="button" onClick={() => fileInput.current?.click()} disabled={uploading} className="text-left">
                <span className="block text-[15px] font-medium text-retail">{uploading ? "Uploading…" : "Click to upload or drag and drop"}</span>
                <span className="block text-[13px] text-muted">PDF, JPG or PNG · Maximum file size 5 MB</span>
              </button>
              <input
                ref={fileInput}
                type="file"
                accept="application/pdf,image/jpeg,image/png"
                className="sr-only"
                tabIndex={-1}
                aria-label="Upload certificate of analysis"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void chooseFile(file);
                }}
              />
            </div>
            {fileError ? (
              <p role="alert" className="mt-2 text-sm text-danger">
                {fileError}
              </p>
            ) : null}
            {certificate ? (
              <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-line px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-[15px] text-ink">{certificate.name}</p>
                  <p className="text-xs text-muted">{Math.max(1, Math.round(certificate.size / 1024)).toLocaleString("en-US")} KB · Upload complete</p>
                </div>
                <button type="button" onClick={dropCertificate} className="shrink-0 text-sm font-semibold text-danger hover:underline" aria-label={`Remove ${certificate.name}`}>
                  Remove
                </button>
              </div>
            ) : null}
          </div>
          <Field label="Additional notes (optional)" error={errors.notes}>
            {({ id, invalid, describedBy }) => (
              <textarea
                id={id}
                name="notes"
                rows={3}
                maxLength={500}
                aria-invalid={invalid}
                aria-describedby={describedBy}
                className={`${controlClass} h-auto py-3 ${errors.notes ? "border-danger" : "border-field-border"}`}
              />
            )}
          </Field>
        </Card>

        <label className="flex cursor-pointer items-start gap-3 text-sm text-body">
          <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-0.5 size-5 accent-[#0e6b4f]" />
          I confirm that the batch details are accurate and this product meets all applicable regulatory and quality requirements.
        </label>

        {formError ? (
          <p role="alert" className="rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger">
            {formError}
          </p>
        ) : null}

        <div className="flex items-center justify-end gap-3 border-t border-line pt-5">
          <Link href={site.manufacturer.batches} onClick={() => void dropCertificate()} className="flex h-12 items-center rounded-xl bg-pill px-6 text-[15px] font-semibold text-body transition hover:bg-track">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={pending || uploading}
            className="h-12 rounded-xl bg-retail px-6 text-[15px] font-semibold text-white transition hover:bg-retail-dark disabled:opacity-70"
          >
            {pending ? "Please wait…" : "Declare Batch"}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <aside className="rounded-xl border border-line bg-white p-6" aria-label="Declaration summary">
          <h2 className="text-lg font-semibold text-ink">Declaration summary</h2>
          <p className="mt-4 text-xs text-muted">Product</p>
          <p className="mt-1 text-lg font-semibold text-ink">{product ? [product.name, product.variant].filter(Boolean).join(" · ") : "—"}</p>
          <p className="text-xs text-muted">{product?.sku ?? ""}</p>
          <dl className="mt-5 space-y-3.5 border-t border-row-line pt-5">
            <SummaryRow label="Batch number" value={batchNumber.trim().toUpperCase() || "—"} />
            <SummaryRow label="Quantity" value={Number.isFinite(quantity) && quantity > 0 ? `${quantity.toLocaleString("en-US")} packs` : "—"} />
            <SummaryRow label="Manufactured" value={made ? formatDate(made) : "—"} />
            <SummaryRow label="Expires" value={expires ? formatDate(expires) : "—"} />
            <SummaryRow label="Facility" value={facility.trim() || "—"} />
          </dl>
          {certificate ? <p className="mt-5 rounded-lg bg-surface-soft px-4 py-3 text-[13px] text-body">1 supporting document attached</p> : null}
        </aside>

        <aside className="rounded-xl border border-line bg-white p-6" aria-label="What happens next">
          <h2 className="text-lg font-semibold text-ink">What happens next?</h2>
          <ol className="mt-4 space-y-5">
            {NEXT_STEPS.map((step) => (
              <li key={step.title} className="flex gap-3">
                <span aria-hidden="true" className="mt-0.5 size-2 shrink-0 rounded-full bg-retail" />
                <div>
                  <p className="text-sm font-semibold text-ink">{step.title}</p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-muted">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </aside>

        <aside className="rounded-xl bg-retail-soft p-5">
          <p className="text-sm font-semibold text-retail-dark">Check before declaring</p>
          <p className="mt-1 text-[13px] leading-relaxed text-body">Make sure the batch number and dates match your product packaging before generating codes.</p>
        </aside>
        <p className="text-xs text-muted">* Required fields</p>
      </div>
    </form>
  );
}
