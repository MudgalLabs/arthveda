import { FC, memo, useMemo, useState } from "react";
import { SearchAutocomplete } from "@/components/search_autocomplete";
import { InputProps } from "netra";
import { useControlled } from "@/hooks/use_controlled";
import { apiHooks } from "@/hooks/api_hooks";
import { useDebounce } from "@/hooks/use_debounce";
import { cn } from "@/lib/utils";

interface SymbolInputProps extends Omit<InputProps, "value" | "onChange"> {
    value?: string;
    onChange?: (value: string) => void;
}

export const SymbolSearch: FC<SymbolInputProps> = memo((props) => {
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

    return (
        <SearchAutocomplete
            inputValue={inputValue}
            onInputChange={(_, newInputValue) => {
                setInputValue(newInputValue.toUpperCase());
                setValue(newInputValue.toUpperCase());
                onChangeProp?.(newInputValue.toUpperCase());
            }}
            value={value}
            onChange={(_, newValue) => {
                setValue(newValue ?? "");
                onChangeProp?.(newValue ?? "");
            }}
            options={options}
            isLoading={isLoading}
            variant={variant}
            errorMsg={errorMsg}
            renderInputProps={restProps}
            freeSolo
            filterOptions={(opts) => opts}
            noOptionsText={<span className="text-foreground-muted text-sm">No options</span>}
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
    );
});
