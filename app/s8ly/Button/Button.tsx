import { forwardRef } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "default" | "small" | "large";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ size = "default", children }, ref) => {
    return <button className="bg-white text-black">{children}</button>;
  },
);

Button.displayName = "Button";

export { Button };
export type { ButtonProps };
