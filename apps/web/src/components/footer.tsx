import { site } from "@/lib/site";
import { Logo } from "./logo";

export function Footer() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 text-xs text-muted md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Logo />
          <p>Making it easy for anyone in Nigeria to tell a genuine product from a fake.</p>
        </div>
        <p>
          © {new Date().getFullYear()} {site.name}
        </p>
      </div>
    </footer>
  );
}
