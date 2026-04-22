type Hatch = "horizontal" | "vertical" | "diagonal" | "wash";

const HATCH: Record<Hatch, string> = {
  horizontal: "repeating-linear-gradient(0deg, rgba(11,11,13,0.04) 0 1px, transparent 1px 6px)",
  vertical: "repeating-linear-gradient(90deg, rgba(11,11,13,0.05) 0 1px, transparent 1px 8px)",
  diagonal: "repeating-linear-gradient(45deg, rgba(11,11,13,0.05) 0 1px, transparent 1px 6px)",
  wash: "",
};

export function PlatePlaceholder({
  tint,
  aspect = "4/5",
  hatch = "horizontal",
  className = "",
  tintStop = "70%",
}: {
  tint: string;
  aspect?: "4/5" | "3/4" | "16/10" | "full";
  hatch?: Hatch;
  className?: string;
  tintStop?: string;
}) {
  const aspectClass =
    aspect === "full"
      ? ""
      : aspect === "3/4"
      ? "aspect-[3/4]"
      : aspect === "16/10"
      ? "aspect-[16/10]"
      : "aspect-[4/5]";

  const wash = `linear-gradient(135deg, ${tint}, transparent ${tintStop})`;
  const backgroundImage = HATCH[hatch] ? `${wash}, ${HATCH[hatch]}` : wash;

  return (
    <div
      className={`${aspectClass} w-full border border-ink/15 ${className}`.trim()}
      style={{ backgroundImage }}
    />
  );
}
