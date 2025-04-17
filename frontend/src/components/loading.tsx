import { FC } from "react";

interface LoadingProps {
    color?: string;
}
export const Loading: FC<LoadingProps> = ({ color }) => {
    let borderColor = "border-primary-500";

    if (color) {
        if (color.startsWith("--")) {
            borderColor = `border-(${color})`;
        } else {
            borderColor = `border-[${color}]`;
        }
    }

    return (
        <div className="flex h-full w-full items-center justify-center">
            <div className={borderColor}>
                <div className="h-6 w-6 animate-spin rounded-full border-3 border-[inherit] border-b-transparent" />
            </div>
        </div>
    );
};
