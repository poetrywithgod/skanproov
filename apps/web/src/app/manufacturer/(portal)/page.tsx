import { redirect } from "next/navigation";
import { site } from "@/lib/site";

/** The portal opens on Products until the Overview is built. */
export default function ManufacturerPortalHome() {
  redirect(site.manufacturer.products);
}
