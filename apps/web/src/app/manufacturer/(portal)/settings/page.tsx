import { redirect } from "next/navigation";
import { site } from "@/lib/site";

export default function SettingsIndex() {
  redirect(`${site.manufacturer.settings}/company`);
}
