import { cn } from "@/lib/utils";
import { ComponentProps, FC } from "react";

type TextLinkProps = ComponentProps<"a">;

const TextLink: FC<TextLinkProps> = ({ children, className, ...props }) => {
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

TextLink.displayName = "TextLink";

export { TextLink };
export type { TextLinkProps };
