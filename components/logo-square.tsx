import clsx from "clsx";
import LogoIcon from "./icons/logo";

export default function LogoSquare({ size }: { size?: "sm" | undefined }) {
  return (
    <div
      className={clsx(
        "flex flex-none items-center justify-center border border-warm-black-700 bg-warm-black-900 text-pink-200",
        {
          "h-[40px] w-[40px] rounded-xl": !size,
          "h-[30px] w-[30px] rounded-lg": size === "sm",
        },
      )}
    >
      <LogoIcon
        className={clsx({
          "h-[20px] w-[20px]": !size,
          "h-[14px] w-[14px]": size === "sm",
        })}
      />
    </div>
  );
}
