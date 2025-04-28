import { FC, ReactNode } from "react";

import { Label, LabelProps, TextInput, TextInputProps } from "@/s8ly";

export interface InputWithLabelProps {
    label: ReactNode;
    labelProps?: LabelProps;
    inputProps?: TextInputProps;
}

export const InputWithLabel: FC<InputWithLabelProps> = (props) => {
    const { label, inputProps, labelProps } = props;

    return (
        <div className="flex flex-col gap-y-1.5">
            <Label {...labelProps}>{label}</Label>
            <TextInput compact {...inputProps} />
        </div>
    );
};
