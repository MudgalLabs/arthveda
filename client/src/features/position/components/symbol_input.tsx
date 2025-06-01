import { useControlled } from "@/hooks/use_controlled";
import { Input, InputProps } from "@/s8ly";
import { FC, memo } from "react";

interface SymbolInputProps extends Omit<InputProps, "value" | "onChange"> {
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>, value: string) => void;
}

export const SymbolInput: FC<SymbolInputProps> = memo((props) => {
    const { value: valueProp, onChange: onChangeProp, ...rest } = props;

    const [value, setValue] = useControlled<string>({
        controlled: valueProp,
        default: "",
        name: "value",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toUpperCase();
        setValue(value);
        onChangeProp?.(e, value);
    };

    return <Input value={value} onChange={handleChange} {...rest} />;
});
