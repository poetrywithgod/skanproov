export function ComingSoon({ title, body }: { title: string; body: string }) {
  return (
    <div className="px-5 pt-5">
      <h1 className="text-2xl font-bold tracking-normal text-ink">{title}</h1>
      <div className="mt-5 rounded-2xl bg-white px-5 py-10 text-center shadow-[0_1px_4px_rgba(15,31,23,0.06)]">
        <p className="mx-auto max-w-[260px] text-sm leading-[1.5] text-body">{body}</p>
      </div>
    </div>
  );
}
