import { FC, ReactNode } from "react";

export interface WithLabelProps {
    Input: ReactNode;
    Label: ReactNode;
}

export const WithLabel: FC<WithLabelProps> = (props) => {
    const { Input, Label } = props;

    return (
        <div className="flex flex-col gap-y-2">
            {Label}
            {Input}
        </div>
    );
};
