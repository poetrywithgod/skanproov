import Image from "next/image";
import Link from "next/link";

/**
 * The only place the logo is rendered. To swap the logo, replace
 * public/brand/logo.png (and mark.png, src/app/icon.png, apple-icon.png,
 * opengraph-image.png). No code change needed if the proportions stay similar.
 */
export function Logo({ className = "h-9 md:h-10", href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} aria-label="SKANPROOV home" className="flex w-fit shrink-0 items-center">
      <Image
        src="/brand/logo.png"
        alt="SKANPROOV"
        width={1200}
        height={416}
        priority
        sizes="116px"
        className={`${className} w-auto`}
      />
    </Link>
  );
}
