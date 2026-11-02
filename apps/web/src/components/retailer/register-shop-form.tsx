"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { PrimaryButton } from "@/components/auth/primary-button";
import { TextField } from "@/components/auth/fields";
import { registerShopAction } from "@/app/retailer/actions";
import { site } from "@/lib/site";

type Errors = Partial<Record<"business" | "branch" | "address" | "city", string>>;

export function RegisterShopForm() {
  const router = useRouter();
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const data = new FormData(event.currentTarget);
    setPending(true);
    try {
      const result = await registerShopAction({
        business: data.get("business"),
        branch: data.get("branch"),
        address: data.get("address"),
        city: data.get("city"),
      });
      if (result.ok) {
        router.replace(site.retailer.home);
        router.refresh();
        return;
      }
      setErrors(result.fields ?? {});
      setFormError(result.message ?? null);
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-6 space-y-5">
      <TextField label="Business name" name="business" autoComplete="organization" placeholder="Olumide Supermarket" error={errors.business} />
      <TextField label="Branch name" name="branch" placeholder="Ikeja branch" error={errors.branch} />
      <TextField label="Branch address" name="address" autoComplete="street-address" placeholder="12 Allen Avenue" error={errors.address} />
      <TextField label="City" name="city" autoComplete="address-level2" placeholder="Lagos" error={errors.city} />

      <p className="rounded-lg bg-brand-soft px-3.5 py-2.5 text-[13px] leading-[1.45] text-body">
        SKANPROOV approves each branch before it can receive cartons. You can look around the app while you wait.
      </p>

      {formError ? (
        <p role="alert" className="rounded-lg bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
          {formError}
        </p>
      ) : null}

      <PrimaryButton type="submit" pending={pending} className="mx-auto w-[72%] min-w-[220px]">
        Register my shop
      </PrimaryButton>
    </form>
  );
}
