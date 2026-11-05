/** "Checking this carton": shown from the moment a code is read until the result opens. */
export function CartonChecking({ code, onCancel }: { code: string; onCancel: () => void }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[calc(100dvh-7rem)] flex-col items-center px-4 pt-24 text-center"
    >
      <div className="relative size-[100px]" aria-hidden="true">
        <svg viewBox="0 0 100 100" className="absolute inset-0 size-full">
          <circle cx="50" cy="50" r="46" fill="none" stroke="#0e6b4f" strokeWidth="6" />
          <circle cx="50" cy="50" r="36" fill="none" stroke="#dfe4df" strokeWidth="10" />
        </svg>
        <svg viewBox="0 0 100 100" className="absolute inset-0 size-full animate-spin">
          <circle
            cx="50"
            cy="50"
            r="36"
            fill="none"
            stroke="#0e6b4f"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray="56 170"
          />
        </svg>
      </div>

      <h1 className="mt-6 text-[26px] font-extrabold leading-tight tracking-[-0.03em] text-ink">
        Checking this carton
      </h1>
      <p className="mt-3 max-w-full break-all rounded-full bg-pill px-4 py-1.5 text-sm font-semibold text-body">
        {code}
      </p>
      <p className="mt-5 max-w-[280px] text-[15px] leading-[1.5] text-body">
        Keep this stock off the shelf until the result appears.
      </p>

      <button
        type="button"
        onClick={onCancel}
        className="mt-10 flex h-14 w-full items-center justify-center rounded-2xl border border-line bg-white text-base font-semibold text-ink transition-colors hover:bg-[#f4f6f4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail"
      >
        Cancel
      </button>
    </div>
  );
}
