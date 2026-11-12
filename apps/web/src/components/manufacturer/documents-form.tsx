"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  DOCUMENT_MAX_BYTES,
  DOCUMENT_TYPES,
  MANUFACTURER_DOCUMENTS,
  MANUFACTURER_DOCUMENT_BUCKET,
  type ManufacturerDocumentKind,
} from "@skanproov/validation";
import { submitApplicationAction } from "@/app/manufacturer/actions";
import type { UploadedDocument } from "@/lib/manufacturer/data";
import { createClient } from "@/lib/supabase/browser";
import { site } from "@/lib/site";
import { SectionTitle, SubmitButton } from "./form-bits";

const EXTENSIONS: Record<string, string> = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png" };

function formatSize(bytes: number): string {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** "Verification Documents": upload each file, then submit the application for checking. */
export function DocumentsForm({ userId, initial }: { userId: string; initial: UploadedDocument[] }) {
  const router = useRouter();
  const [documents, setDocuments] = useState<Record<string, UploadedDocument>>(
    Object.fromEntries(initial.map((doc) => [doc.kind, doc])),
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  const missing = MANUFACTURER_DOCUMENTS.filter((doc) => doc.required && !documents[doc.kind]);

  function setError(kind: string, message: string | null) {
    setErrors((current) => {
      const next = { ...current };
      if (message) next[kind] = message;
      else delete next[kind];
      return next;
    });
  }

  async function upload(kind: ManufacturerDocumentKind, file: File) {
    setError(kind, null);
    if (!(DOCUMENT_TYPES as readonly string[]).includes(file.type)) {
      setError(kind, "Use a PDF, JPG or PNG file.");
      return;
    }
    if (file.size > DOCUMENT_MAX_BYTES) {
      setError(kind, "That file is too big. The limit is 5 MB.");
      return;
    }

    setBusy(kind);
    const supabase = createClient();
    const path = `${userId}/${kind}/${crypto.randomUUID()}.${EXTENSIONS[file.type]}`;
    try {
      const stored = await supabase.storage.from(MANUFACTURER_DOCUMENT_BUCKET).upload(path, file, { contentType: file.type });
      if (stored.error) throw stored.error;

      const { data: oldPath, error } = await supabase.rpc("add_manufacturer_document", {
        p_kind: kind,
        p_path: path,
        p_file_name: file.name.slice(0, 200),
        p_size: file.size,
      });
      if (error) {
        await supabase.storage.from(MANUFACTURER_DOCUMENT_BUCKET).remove([path]);
        throw error;
      }
      if (typeof oldPath === "string" && oldPath) {
        await supabase.storage.from(MANUFACTURER_DOCUMENT_BUCKET).remove([oldPath]);
      }
      setDocuments((current) => ({ ...current, [kind]: { kind, fileName: file.name, sizeBytes: file.size } }));
    } catch {
      setError(kind, "We couldn't upload that file. Please try again.");
    } finally {
      setBusy(null);
      const input = inputs.current[kind];
      if (input) input.value = "";
    }
  }

  async function remove(kind: ManufacturerDocumentKind) {
    setError(kind, null);
    setBusy(kind);
    const supabase = createClient();
    try {
      const { data: path, error } = await supabase.rpc("remove_manufacturer_document", { p_kind: kind });
      if (error) throw error;
      if (typeof path === "string" && path) {
        await supabase.storage.from(MANUFACTURER_DOCUMENT_BUCKET).remove([path]);
      }
      setDocuments((current) => {
        const next = { ...current };
        delete next[kind];
        return next;
      });
    } catch {
      setError(kind, "We couldn't remove that file. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function submit() {
    setFormError(null);
    if (missing.length > 0) {
      setFormError(`Please upload: ${missing.map((doc) => doc.label.toLowerCase()).join(" and ")}.`);
      return;
    }
    setPending(true);
    try {
      const result = await submitApplicationAction();
      if (result.ok) {
        router.replace(site.manufacturer.register);
        router.refresh();
        return;
      }
      setFormError(result.message);
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="space-y-5">
      <SectionTitle>Verification Documents</SectionTitle>
      <ul className="space-y-5">
        {MANUFACTURER_DOCUMENTS.map((doc) => {
          const uploaded = documents[doc.kind];
          const working = busy === doc.kind;
          return (
            <li
              key={doc.kind}
              className="rounded-[4px] border border-dashed border-retail/40 bg-retail-soft/30 px-4 py-3.5 sm:px-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-base font-medium text-ink">{doc.label}</p>
                  {uploaded ? (
                    <p className="mt-0.5 truncate text-sm text-retail-dark">
                      {uploaded.fileName} · {formatSize(uploaded.sizeBytes)}
                    </p>
                  ) : (
                    <p className="mt-0.5 text-sm text-body">{doc.note}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {uploaded ? (
                    <button
                      type="button"
                      onClick={() => void remove(doc.kind)}
                      disabled={working}
                      className="h-9 rounded-[4px] px-3 text-sm font-semibold text-danger hover:underline disabled:opacity-60"
                    >
                      Remove
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => inputs.current[doc.kind]?.click()}
                    disabled={working}
                    className="h-9 min-w-[96px] rounded-[4px] border border-retail bg-white px-4 text-sm font-semibold text-retail-dark transition hover:bg-retail-soft disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {working ? "Working…" : uploaded ? "Replace" : "Upload"}
                  </button>
                  <input
                    ref={(node) => {
                      inputs.current[doc.kind] = node;
                    }}
                    type="file"
                    accept="application/pdf,image/jpeg,image/png"
                    className="sr-only"
                    tabIndex={-1}
                    aria-label={`Upload ${doc.label}`}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void upload(doc.kind, file);
                    }}
                  />
                </div>
              </div>
              {errors[doc.kind] ? (
                <p role="alert" className="mt-2 text-sm text-danger">
                  {errors[doc.kind]}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>

      {formError ? (
        <p role="alert" className="rounded-lg bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
          {formError}
        </p>
      ) : null}

      <form
        className="pt-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <SubmitButton pending={pending}>Submit for Verification</SubmitButton>
        <p className="mt-4 text-center text-xs text-body">
          Our team reviews every company. We will e-mail you when you are approved, or if we need more information.
        </p>
      </form>
    </section>
  );
}
