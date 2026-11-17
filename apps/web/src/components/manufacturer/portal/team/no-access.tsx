import Link from "next/link";
import { PortalTopBar } from "@/components/manufacturer/portal/portal-top-bar";
import { NO_ACCESS_MESSAGE } from "@/lib/manufacturer/team-shared";
import { site } from "@/lib/site";

/** A screen the person's role does not allow. The database refuses the actions too; this only explains. */
export function NoAccess({ title, what }: { title: string; what: string }) {
  return (
    <>
      <PortalTopBar title={title} />
      <main className="px-5 py-6 sm:px-8">
        <div className="mx-auto mt-10 max-w-md rounded-xl border border-line bg-white px-6 py-12 text-center" role="status">
          <p className="text-base font-semibold text-ink">{what}</p>
          <p className="mt-1 text-sm text-muted">{NO_ACCESS_MESSAGE}</p>
          <Link href={site.manufacturer.home} className="mt-4 inline-block text-sm font-semibold text-retail hover:underline">
            Go back
          </Link>
        </div>
      </main>
    </>
  );
}
