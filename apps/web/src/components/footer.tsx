import { site } from "@/lib/site";
import { Logo } from "./logo";

export function Footer() {
  return (
    <footer className="bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 pb-12 pt-12 md:flex-row md:justify-between md:pb-[67px]">
        <div>
          <Logo className="h-8" />
          <p className="mt-[6.5px] text-sm leading-5 text-muted">
            Making it easy for anyone in Nigeria to tell a genuine product from a fake.
          </p>
        </div>
        <p className="text-[13px] leading-5 text-muted md:mt-[27px]">
          © {new Date().getFullYear()} {site.name}
        </p>
      </div>
    </footer>
  );
}
