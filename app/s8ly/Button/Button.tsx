export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "default" | "small" | "large";
}

export const Button: React.FC<ButtonProps> = ({
  size = "default",
  children,
}) => {
  console.log({ size });
  return <button className="bg-white text-black">{children}</button>;
};
