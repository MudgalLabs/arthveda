import { Input, InputProps } from "@/s8ly";
import { CurrencyKind } from "@/features/trade/trade";
import {
    cn,
    formatCurrency,
    getCurrencySymbol,
    removeFormatCurrency,
} from "@/lib/utils";
import { useControlled } from "@/hooks/use_controlled";

interface CurrencyInputProps extends InputProps {
    currency: CurrencyKind;
    value?: string;
}

function CurrencyInput(props: CurrencyInputProps) {
    const {
        currency,
        className,
        value: valueProp,
        onChange: onChangeProp,
        onFocus: onFocusProp,
        onBlur: onBlurProp,
        ...rest
    } = props;

    const [value, setValue] = useControlled<string>({
        controlled: valueProp,
        default: "",
        name: "value",
    });

    function onChange(e: React.ChangeEvent<HTMLInputElement>) {
        const value = e.target.value;
        setValue(value);
        onChangeProp?.(e);
    }

    function onFocus(e: React.FocusEvent<HTMLInputElement>) {
        setValue(removeFormatCurrency(value));
        onFocusProp?.(e);
    }

    function onBlur(e: React.FocusEvent<HTMLInputElement>) {
        setValue(formatCurrency(value, currency, false));
        onBlurProp?.(e);
    }

    const symbol = getCurrencySymbol(currency);
    return (
        <div className="relative">
            <span className="text-foreground-muted absolute top-1/2 left-3 -translate-y-1/2 select-none">
                {symbol}
            </span>
            <Input
                className={cn("pl-6", className)}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                onFocus={onFocus}
                {...rest}
            />
        </div>
    );
}

export { CurrencyInput };
export type { CurrencyInputProps };
