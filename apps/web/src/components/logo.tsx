import Image from "next/image";
import Link from "next/link";

/**
 * The only place the logo is rendered. To swap the logo, replace
 * public/brand/logo.png (and mark.png, src/app/icon.png, apple-icon.png,
 * opengraph-image.png). No code change needed if the proportions stay similar.
 */
export function Logo({ className = "h-9 md:h-10" }: { className?: string }) {
  return (
    <Link href="/" aria-label="SKANPROOV home" className="inline-flex shrink-0 items-center">
      <Image
        src="/brand/logo.png"
        alt="SKANPROOV"
        width={1200}
        height={416}
        priority
        sizes="(min-width: 768px) 116px, 104px"
        className={`${className} w-auto`}
      />
    </Link>
  );
}
