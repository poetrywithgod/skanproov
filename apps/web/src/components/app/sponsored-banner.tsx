"use client";

import { useEffect, useRef, useState } from "react";
import type { Ad } from "@/lib/ads";

const TONES: Record<Ad["tone"], string> = {
  navy: "from-[#0f2a4a] to-[#1b4a7a]",
  green: "from-[#0d5a3f] to-[#138a5c]",
  plum: "from-[#3b1c4a] to-[#6b2f7a]",
};

/**
 * Sponsored banner carousel shown at the top of the result screen.
 * Always labelled "Sponsored" and never styled as a verdict.
 */
export function SponsoredBanner({ ads }: { ads: Ad[] }) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  const pausedRef = useRef(false);

  useEffect(() => {
    if (ads.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      const track = trackRef.current;
      if (!track || pausedRef.current) return;
      const next = (Math.round(track.scrollLeft / track.clientWidth) + 1) % ads.length;
      track.scrollTo({ left: next * track.clientWidth, behavior: "smooth" });
    }, 5000);
    return () => window.clearInterval(id);
  }, [ads.length]);

  if (ads.length === 0) return null;

  function onScroll() {
    const track = trackRef.current;
    if (!track) return;
    setIndex(Math.round(track.scrollLeft / track.clientWidth));
  }

  function goTo(i: number) {
    const track = trackRef.current;
    track?.scrollTo({ left: i * track.clientWidth, behavior: "smooth" });
  }

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Sponsored offers"
      className="px-3 pt-3"
      onPointerDown={() => (pausedRef.current = true)}
      onPointerUp={() => (pausedRef.current = false)}
      onMouseEnter={() => (pausedRef.current = true)}
      onMouseLeave={() => (pausedRef.current = false)}
    >
      <ul
        ref={trackRef}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory overflow-x-auto rounded-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {ads.map((ad, i) => (
          <li
            key={ad.id}
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${ads.length}`}
            className="w-full shrink-0 snap-center"
          >
            <a
              href={ad.href}
              target="_blank"
              rel="sponsored noopener noreferrer"
              className={`relative flex h-[116px] flex-col justify-between bg-gradient-to-br ${TONES[ad.tone]} p-4 text-white focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white`}
            >
              <span className="absolute right-3 top-3 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                Sponsored
              </span>
              <span className="max-w-[78%]">
                <span className="block text-[13px] font-medium text-white/80">{ad.advertiser}</span>
                <span className="mt-0.5 block text-lg font-bold leading-6">{ad.headline}</span>
              </span>
              <span className="inline-flex h-7 w-fit items-center rounded-full bg-white px-3 text-xs font-bold text-ink">
                {ad.cta} →
              </span>
            </a>
          </li>
        ))}
      </ul>

      {ads.length > 1 ? (
        <div className="mt-2 flex justify-center gap-1.5">
          {ads.map((ad, i) => (
            <button
              key={ad.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Show offer ${i + 1}`}
              aria-current={i === index}
              className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-brand" : "w-1.5 bg-[#c5cec8]"}`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
