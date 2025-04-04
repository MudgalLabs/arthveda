import { cn } from "@/lib/utils";
import { ComponentProps, FC } from "react";

type LinkProps = ComponentProps<"a">;

const Link: FC<LinkProps> = ({ children, className, ...props }) => {
  return (
    <a
      className={cn(
        "text-primary-500 text-right text-[12px] font-bold",
        className,
      )}
      {...props}
    >
      {children}
    </a>
  );
};

Link.displayName = "s8ly_Link";

export { Link };
export type { LinkProps };
