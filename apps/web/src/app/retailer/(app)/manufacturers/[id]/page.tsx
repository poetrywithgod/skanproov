import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ManufacturerProfileView } from "@/components/retailer/manufacturer-profile-view";
import { getManufacturer } from "@/lib/retailer/data";

export const metadata: Metadata = { title: "Manufacturer profile", robots: { index: false } };

export default async function ManufacturerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const profile = await getManufacturer(id);
  if (!profile) notFound();
  return <ManufacturerProfileView profile={profile} />;
}
