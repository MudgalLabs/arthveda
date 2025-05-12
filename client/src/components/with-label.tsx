import { FC, ReactNode } from "react";

export interface WithLabelProps {
    Label: ReactNode;
    children: ReactNode;
}

export const WithLabel: FC<WithLabelProps> = (props) => {
    const { Label, children } = props;

    return (
        <div className="flex flex-col gap-y-2">
            {Label}
            {children}
        </div>
    );
};
