import clsx from "clsx";

/**
 * Holo-Flow mark — a stylised persistence-of-vision ring: an orbit
 * with a single point of light frozen mid-arc. The fill is kept
 * currentColor so parent containers can tint via text-pink-200 etc.
 */
export default function LogoIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      aria-label={`${process.env.SITE_NAME ?? "Holo-Flow Studio"} logo`}
      viewBox="0 0 32 32"
      fill="none"
      {...props}
      className={clsx("h-5 w-5 text-warm-black-50", props.className)}
    >
      <circle
        cx="16"
        cy="16"
        r="13"
        stroke="currentColor"
        strokeOpacity="0.5"
        strokeWidth="1.2"
      />
      <circle
        cx="16"
        cy="16"
        r="9"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="1"
        strokeDasharray="1.5 3"
      />
      <circle cx="26.4" cy="10.2" r="2.4" fill="currentColor" />
    </svg>
  );
}
