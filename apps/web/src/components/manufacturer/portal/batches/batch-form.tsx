"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
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

const EXTENSIONS: Record<string, string> = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png" };

/** Declare a production batch for one of the manufacturer's registered products. */
export function BatchForm({ manufacturerId, products, productId }: { manufacturerId: string; products: BatchProductOption[]; productId?: string }) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [certificate, setCertificate] = useState<{ path: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

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
      setCertificate({ path, name: file.name });
    } catch {
      setFileError("We couldn't upload that file. Please try again.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function dropCertificate() {
    if (certificate) await removeUploaded(certificate.path);
    setCertificate(null);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const form = event.currentTarget;
    const data = new FormData(form);
    setPending(true);
    try {
      const result = await declareBatchAction({
        productId: data.get("productId"),
        batchNumber: data.get("batchNumber"),
        manufacturedOn: data.get("manufacturedOn"),
        expiresOn: data.get("expiresOn"),
        units: data.get("units"),
        facility: data.get("facility"),
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
    <form onSubmit={onSubmit} noValidate className="mt-6 rounded-xl border border-line bg-white px-5 py-7 sm:px-8">
      <div className="space-y-5">
        <Field label="Product" error={errors.productId}>
          {({ id, invalid, describedBy }) => (
            <select
              id={id}
              name="productId"
              defaultValue={productId ?? ""}
              aria-invalid={invalid}
              aria-describedby={describedBy}
              className={`${controlClass} ${errors.productId ? "border-danger" : "border-field-border"}`}
            >
              <option value="" disabled>
                Choose a registered product
              </option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {[product.name, product.variant].filter(Boolean).join(" · ")}
                  {product.sku ? ` (${product.sku})` : ""}
                </option>
              ))}
            </select>
          )}
        </Field>
        <TextInput label="Batch Number" name="batchNumber" placeholder="BT-2026-014" autoComplete="off" error={errors.batchNumber} />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextInput label="Production Date" name="manufacturedOn" type="date" max={todayInLagos()} error={errors.manufacturedOn} />
          <TextInput label="Expiry Date (if any)" name="expiresOn" type="date" error={errors.expiresOn} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextInput label="Number of Units" name="units" type="number" inputMode="numeric" min={1} placeholder="5000" error={errors.units} />
          <TextInput label="Manufacturing Facility (optional)" name="facility" placeholder="Ikeja plant" error={errors.facility} />
        </div>
        <Field label="Notes (optional)" error={errors.notes}>
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
        <div>
          <p className="text-base text-ink">Certificate of Analysis (optional)</p>
          <p className="mt-0.5 text-sm text-muted">PDF, JPG or PNG, up to 5 MB.</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
              className="h-10 rounded-lg border border-retail bg-white px-4 text-sm font-semibold text-retail-dark transition hover:bg-retail-soft disabled:opacity-60"
            >
              {uploading ? "Uploading…" : certificate ? "Replace file" : "Upload file"}
            </button>
            {certificate ? (
              <>
                <span className="text-sm text-body">{certificate.name}</span>
                <button type="button" onClick={dropCertificate} className="text-sm font-semibold text-danger hover:underline">
                  Remove
                </button>
              </>
            ) : null}
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
        </div>
      </div>

      <p className="mt-6 rounded-lg bg-retail-soft px-4 py-3 text-[13px] leading-relaxed text-body">
        Declaring a batch registers it straight away. Its codes are generated next, and they only start to verify once you release the batch at dispatch.
      </p>

      {formError ? (
        <p role="alert" className="mt-4 rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger">
          {formError}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending || uploading}
          className="h-12 rounded-xl bg-retail px-6 text-[15px] font-semibold text-white transition hover:bg-retail-dark disabled:opacity-70"
        >
          {pending ? "Please wait…" : "Declare Batch"}
        </button>
        <Link href={site.manufacturer.batches} onClick={() => void dropCertificate()} className="px-2 text-sm font-semibold text-body hover:underline">
          Cancel
        </Link>
      </div>
    </form>
  );
}
