/** Colours for the letter tile, taken from the retailer designs. */
const COLORS = ["#8a4b00", "#1e4f8a", "#1f5fad", "#4a5a50", "#5b3aa6", "#a3281f", "#0e6b4f", "#7a5b00"];

/** The same manufacturer always gets the same colour. */
function colorFor(name: string): string {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return COLORS[hash % COLORS.length] ?? "#0e6b4f";
}

/** A coloured tile with the manufacturer's first letter. Decorative: the name is always written next to it. */
export function ManufacturerAvatar({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
  return (
    <span
      aria-hidden="true"
      style={{ backgroundColor: colorFor(name) }}
      className={`grid shrink-0 place-items-center font-bold text-white ${
        size === "lg" ? "size-14 rounded-xl text-2xl" : "size-11 rounded-lg text-lg"
      }`}
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
