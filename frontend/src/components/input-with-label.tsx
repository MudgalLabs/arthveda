import { FC, ReactNode } from "react";

import { Label, LabelProps, Input, InputProps } from "@/s8ly";

export interface InputWithLabelProps {
    label: ReactNode;
    labelProps?: LabelProps;
    inputProps?: InputProps;
}

export const InputWithLabel: FC<InputWithLabelProps> = (props) => {
    const { label, inputProps, labelProps } = props;

    return (
        <div className="flex flex-col gap-y-1.5">
            <Label {...labelProps}>{label}</Label>
            <Input compact {...inputProps} />
        </div>
    );
};
