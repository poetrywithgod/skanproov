"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_IMAGE_BUCKET,
  PRODUCT_IMAGE_MAX_BYTES,
  PRODUCT_IMAGE_TYPES,
} from "@skanproov/validation";
import { saveProductAction } from "@/app/manufacturer/(portal)/products/actions";
import { SelectInput, TextInput } from "@/components/manufacturer/form-bits";
import { productImageUrl, type ProductDetail } from "@/lib/manufacturer/product-shared";
import { createClient } from "@/lib/supabase/browser";
import { site } from "@/lib/site";
import { ProductThumb } from "./bits";

const EXTENSIONS: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/** Add a product, edit one, or finish a draft. */
export function ProductForm({ manufacturerId, product }: { manufacturerId: string; product?: ProductDetail }) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [imagePath, setImagePath] = useState<string | null>(product?.imagePath ?? null);
  // A picture uploaded in this visit that is not saved with the product yet.
  const [uploaded, setUploaded] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const isDraftOrNew = !product || product.status === "draft";

  async function chooseImage(file: File) {
    setImageError(null);
    if (!(PRODUCT_IMAGE_TYPES as readonly string[]).includes(file.type)) {
      setImageError("Use a JPG, PNG or WebP picture.");
      return;
    }
    if (file.size > PRODUCT_IMAGE_MAX_BYTES) {
      setImageError("That picture is too big. The limit is 2 MB.");
      return;
    }
    setUploading(true);
    const supabase = createClient();
    const path = `${manufacturerId}/${crypto.randomUUID()}.${EXTENSIONS[file.type]}`;
    try {
      const { error } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).upload(path, file, { contentType: file.type });
      if (error) throw error;
      // Replacing a picture chosen earlier in this visit: the earlier one is not needed.
      if (uploaded) await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([uploaded]);
      if (preview) URL.revokeObjectURL(preview);
      setUploaded(path);
      setImagePath(path);
      setPreview(URL.createObjectURL(file));
    } catch {
      setImageError("We couldn't upload that picture. Please try again.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  function removeImage() {
    setImagePath(null);
    setPreview(null);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const draft = submitter?.value === "draft";
    const data = new FormData(event.currentTarget);
    setPending(true);
    try {
      const result = await saveProductAction(
        {
          name: data.get("name"),
          sku: data.get("sku"),
          category: data.get("category") || undefined,
          variant: data.get("variant"),
          packSize: data.get("packSize"),
          description: data.get("description"),
          brand: data.get("brand"),
          nafdacNumber: data.get("nafdacNumber"),
          imagePath: imagePath ?? "",
          draft,
        },
        product?.id,
      );
      if (result.ok) {
        router.push(draft && isDraftOrNew ? site.manufacturer.products : `${site.manufacturer.products}/${result.id}`);
        router.refresh();
        return;
      }
      setErrors(result.fields ?? {});
      setFormError(result.message ?? null);
      const first = Object.keys(result.fields ?? {})[0];
      if (first) event.currentTarget.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  const shownPreview = preview ?? productImageUrl(imagePath);

  return (
    <form onSubmit={onSubmit} noValidate className="mt-6 rounded-xl border border-line bg-white px-5 py-7 sm:px-8">
      <div className="flex flex-wrap items-center gap-6">
        {shownPreview ? (
          // eslint-disable-next-line @next/next/no-img-element -- a local preview of the chosen file
          <img src={shownPreview} alt="Product" className="size-40 rounded-xl bg-pill object-cover" />
        ) : (
          <ProductThumb path={null} name="Product" size="lg" />
        )}
        <div>
          <p className="text-base font-medium text-ink">Product image</p>
          <p className="mt-0.5 text-sm text-muted">A clear picture of the product. JPG, PNG or WebP, up to 2 MB.</p>
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
              className="h-10 rounded-lg border border-retail bg-white px-4 text-sm font-semibold text-retail-dark transition hover:bg-retail-soft disabled:opacity-60"
            >
              {uploading ? "Uploading…" : imagePath ? "Replace image" : "Upload image"}
            </button>
            {imagePath ? (
              <button type="button" onClick={removeImage} className="text-sm font-semibold text-danger hover:underline">
                Remove
              </button>
            ) : null}
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              tabIndex={-1}
              aria-label="Upload product image"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void chooseImage(file);
              }}
            />
          </div>
          {imageError ? (
            <p role="alert" className="mt-2 text-sm text-danger">
              {imageError}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-8 space-y-5">
        <TextInput label="Product Name" name="name" defaultValue={product?.name} placeholder="PureLife Vitamin C" error={errors.name} />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextInput label="Strength or Type" name="variant" defaultValue={product?.variant ?? ""} placeholder="1000 mg" error={errors.variant} />
          <TextInput label="Pack Size" name="packSize" defaultValue={product?.packSize ?? ""} placeholder="60 tablets" error={errors.packSize} />
        </div>
        <TextInput
          label="Short Description"
          name="description"
          defaultValue={product?.description ?? ""}
          placeholder="Daily immune support · 60 tablets per bottle"
          error={errors.description}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextInput label="Product SKU" name="sku" defaultValue={product?.sku ?? ""} placeholder="PL-VC-1000" error={errors.sku} />
          <SelectInput
            label="Category"
            name="category"
            defaultValue={product?.category ?? ""}
            placeholder="Choose a category"
            options={PRODUCT_CATEGORIES}
            error={errors.category}
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextInput label="Brand" name="brand" defaultValue={product?.brand ?? ""} placeholder="PureLife" error={errors.brand} />
          <TextInput
            label="NAFDAC Number (if you have one)"
            name="nafdacNumber"
            defaultValue={product?.nafdacNumber ?? ""}
            placeholder="A1-1234"
            error={errors.nafdacNumber}
          />
        </div>
      </div>

      <p className="mt-6 rounded-lg bg-retail-soft px-4 py-3 text-[13px] leading-relaxed text-body">
        {isDraftOrNew
          ? "A product needs a SKU and a category to be registered. Until then you can keep it as a draft. Only registered products can have batches declared and codes generated."
          : "This product is registered. Changes to its details apply straight away."}
      </p>

      {formError ? (
        <p role="alert" className="mt-4 rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger">
          {formError}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          value="register"
          disabled={pending || uploading}
          className="h-12 rounded-xl bg-retail px-6 text-[15px] font-semibold text-white transition hover:bg-retail-dark disabled:opacity-70"
        >
          {pending ? "Please wait…" : !product ? "Register Product" : product.status === "draft" ? "Register Product" : "Save Changes"}
        </button>
        {isDraftOrNew ? (
          <button
            type="submit"
            value="draft"
            disabled={pending || uploading}
            className="h-12 rounded-xl border border-field-border bg-white px-6 text-[15px] font-semibold text-ink transition hover:bg-pill disabled:opacity-70"
          >
            Save as Draft
          </button>
        ) : null}
        <Link href={product ? `${site.manufacturer.products}/${product.id}` : site.manufacturer.products} className="px-2 text-sm font-semibold text-body hover:underline">
          Cancel
        </Link>
      </div>
    </form>
  );
}
