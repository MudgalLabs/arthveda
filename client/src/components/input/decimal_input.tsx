import { useEffect, useMemo, useState } from "react";
import {
    Input,
    InputProps,
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/s8ly";
import { CurrencyCode } from "@/features/position/position";
import { cn, formatCurrency, getCurrencySymbol } from "@/lib/utils";
import { useControlled } from "@/hooks/use_controlled";
import { DecimalString } from "@/lib/types";

export interface DecimalInputProps extends InputProps {
    kind: DecimalFieldKind;
    currency?: CurrencyCode;
    value?: DecimalString; // To improve types.
}

export function DecimalInput(props: DecimalInputProps) {
    const {
        kind,
        className,
        currency = "inr",
        value: valueProp,
        onChange: onChangeProp,
        onFocus: onFocusProp,
        onBlur: onBlurProp,
        variant: variantProp,
        ...rest
    } = props;

    const isCurrency = kind === "amount";

    const [value, setValue] = useControlled<DecimalString>({
        controlled: valueProp,
        default: "",
        name: "value",
    });
    const [displayValue, setDisplayValue] = useState(valueProp || "");
    const [isFocused, setIsFocused] = useState(false);

    // If the `value` is invalid, why it is invalid.
    const [error, setError] = useState<string | null>(null);

    // State to manange the popover state whether to show or hide
    // the popover to show the `error` if any.
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!isFocused) {
            if (value.trim() === "") {
                return setDisplayValue("");
            }

            setDisplayValue(
                isCurrency && value
                    ? formatCurrency(value, currency, false)
                    : value
            );

            setError(null);
        } else {
            setDisplayValue(value);
        }
    }, [value, isCurrency, isFocused, currency]);

    useEffect(() => {
        setOpen(!!error);
    }, [error]);

    function onChange(e: React.ChangeEvent<HTMLInputElement>) {
        const value = e.target.value;

        if (!/^[-]?\d*(\.\d*)?$/.test(value)) {
            return {
                valid: false,
                error: "Only digits and at most one decimal point are allowed.",
            };
        }

        const { valid, error } = validateDecimalString(value, kind);

        if (value === "" || valid) {
            setValue(value);
            onChangeProp?.(e);
            setError(null);
        } else {
            setError(error ?? "Invalid input");
        }
    }

    function onFocus(e: React.FocusEvent<HTMLInputElement>) {
        setIsFocused(true);
        onFocusProp?.(e);
        setOpen(!!error);
    }

    function onBlur(e: React.FocusEvent<HTMLInputElement>) {
        setIsFocused(false);
        onBlurProp?.(e);
        setOpen(false);
    }

    const symbol = getCurrencySymbol(currency);

    const variant = useMemo(() => {
        // If the variantProp is passed as error, we use that.
        if (variantProp === "error") return "error";
        // If it's passed as default, we check if there is an error.
        if (variantProp === "default") {
            if (error) return "error";
        }
        // If the variantProp is not passed, we check if there is an error.
        if (error) return "error";
        // Otherwise, we return the default variant.
        return "default";
    }, [variantProp, error]);

    return (
        <Popover open={open}>
            <PopoverTrigger asChild>
                <div className="relative">
                    {isCurrency && (
                        <span className="text-foreground-muted absolute top-1/2 left-3 -translate-y-1/2 select-none">
                            {symbol}
                        </span>
                    )}

                    <Input
                        className={cn(
                            "w-44!",
                            {
                                "pl-6": isCurrency,
                            },
                            className
                        )}
                        variant={variant}
                        value={displayValue}
                        onChange={onChange}
                        onFocus={onFocus}
                        onBlur={onBlur}
                        {...rest}
                    />
                </div>
            </PopoverTrigger>
            <PopoverContent
                side="top"
                align="start"
                sideOffset={4}
                onOpenAutoFocus={(e) => {
                    e.preventDefault();
                }}
                onCloseAutoFocus={(e) => {
                    e.preventDefault();
                }}
                className="text-sm"
            >
                {error}
            </PopoverContent>
        </Popover>
    );
}

type DecimalFieldKind = "amount" | "quantity";

const decimalConstraints: Record<
    DecimalFieldKind,
    { precision: number; scale: number }
> = {
    amount: { precision: 14, scale: 2 },
    quantity: { precision: 20, scale: 8 },
};

function validateDecimalString(
    value: string,
    kind: DecimalFieldKind
): { valid: boolean; error?: string } {
    const { precision, scale } = decimalConstraints[kind];

    const [intPartRaw = "", fracPart = ""] = value.split(".");
    const intPart = intPartRaw.replace("-", "").replace(/^0+/, "") || "0";

    const totalDigits = intPart.length + fracPart.length;

    if (totalDigits > precision) {
        return {
            valid: false,
            error: `Too many digits. Max ${precision} total digits allowed (including before and after decimal).`,
        };
    }

    if (fracPart.length > scale) {
        return {
            valid: false,
            error: `Too many decimal places. Max ${scale} digits allowed after the decimal point.`,
        };
    }

    return { valid: true };
}
