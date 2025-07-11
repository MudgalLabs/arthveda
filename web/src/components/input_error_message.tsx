import { cn } from "@/lib/utils";
import { FC } from "react";

interface InputErrorMessageProps {
    errorMsg: string;
    className?: string;
}

export const InputErrorMessage: FC<InputErrorMessageProps> = ({ errorMsg, className }) => {
    return <p className={cn("text-text-destructive text-xs", className)}>{errorMsg}</p>;
};
