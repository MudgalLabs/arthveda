import { FC, memo, useEffect, useMemo, useState } from "react";
import Autocomplete from "@mui/material/Autocomplete";

import { Input, InputProps } from "netra";
import { useControlled } from "@/hooks/use_controlled";
import { apiHooks } from "@/hooks/api_hooks";
import { useDebounce } from "@/hooks/use_debounce";
import { IconSearch } from "@/components/icons";
import { Loading } from "@/components/loading";
import { cn } from "@/lib/utils";
import { InputErrorMessage } from "@/components/input_error_message";

interface SymbolInputProps extends Omit<InputProps, "value" | "onChange"> {
    value?: string;
    onChange?: (value: string) => void;
}

export const SymbolInput: FC<SymbolInputProps> = memo((props) => {
    const { value: valueProp, onChange: onChangeProp, variant, errorMsg, ...restProps } = props;

    const [inputValue, setInputValue] = useState("");
    const debouncedInputValue = useDebounce(inputValue, 500);

    const { data, isLoading } = apiHooks.symbol.useSearch({
        query: debouncedInputValue,
    });

    const options = useMemo(() => {
        if (!data || !data.data) return [];
        return data.data;
    }, [data]);

    const [value, setValue] = useControlled<string>({
        controlled: valueProp,
        default: "",
        name: "value",
    });

    const [focus, setFocus] = useState(false);
    const [open, setOpen] = useState(false);

    const handleChange = (newValue: string) => {
        setValue(newValue);
        onChangeProp?.(newValue);
    };

    const handleFocus = () => {
        setFocus(true);
        if (!open) {
            setOpen(true);
        }
    };

    const handleBlur = () => {
        setFocus(false);
        setOpen(false);
    };

    useEffect(() => {
        if (options.length === 0) {
            setOpen(false);
        } else {
            if (focus) {
                setOpen(true);
            }
        }
    }, [options]);

    return (
        <>
            <Autocomplete
                inputValue={inputValue}
                onInputChange={(_, newInputValue) => {
                    setInputValue(newInputValue.toUpperCase());
                    handleChange(newInputValue.toUpperCase());
                }}
                value={value}
                onChange={(_, newValue) => handleChange(newValue ?? "")}
                freeSolo
                disablePortal
                open={open}
                onFocus={handleFocus}
                onBlur={handleBlur}
                options={options}
                filterOptions={(options) => options}
                slotProps={{
                    listbox: {
                        className: "bg-surface-bg text-surface-foreground border-1 border-border",
                    },
                    paper: {
                        className: "bg-surface-bg! border-1 border-border",
                    },
                }}
                noOptionsText={<span className="text-foreground-muted text-sm">No options</span>}
                renderInput={(params) => {
                    const { type, ...restInputProps } = params.inputProps;
                    return (
                        <div ref={params.InputProps.ref} className="relative">
                            <span className="text-foreground-muted absolute top-3 left-3 text-base select-none">
                                <IconSearch />
                            </span>

                            <Input
                                {...restInputProps}
                                className="text-foreground pl-8"
                                type="text"
                                {...restProps}
                                variant={variant}
                            />

                            {isLoading && (
                                <span className="absolute top-1.5 right-3 text-base select-none">
                                    <Loading size="18" />
                                </span>
                            )}
                        </div>
                    );
                }}
                renderOption={(props, option) => {
                    const { key, className, ...optionProps } = props;
                    return (
                        <li
                            key={key}
                            {...optionProps}
                            className={cn(
                                "bg-surface-bg border-border text-foreground hover:bg-primary hover:text-foreground",
                                "[&.Mui-focused]:bg-accent-muted!",
                                "[&:focus]:bg-accent-muted!",
                                "[&[aria-selected='true']]:bg-accent-muted!",
                                className
                            )}
                        >
                            <span className="py-1! text-sm!">{option}</span>
                        </li>
                    );
                }}
            />

            {variant === "error" && errorMsg && <InputErrorMessage errorMsg={errorMsg} />}
        </>
    );
});
