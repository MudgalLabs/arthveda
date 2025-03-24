export interface ButtonProps {
  children: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({ children }) => {
  return <button className="bg-white text-black">{children}</button>
}
