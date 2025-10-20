import { ReactNode, useEffect, useState } from "react";
import Autocomplete, { AutocompleteProps } from "@mui/material/Autocomplete";
import { Input, InputProps } from "netra";
import { IconSearch } from "@/components/icons";
import { Loading } from "@/components/loading";
import { InputErrorMessage } from "@/components/input_error_message";

interface SearchAutocompleteProps<
    T,
    Multiple extends boolean | undefined = false,
    FreeSolo extends boolean | undefined = false,
> extends Omit<AutocompleteProps<T, Multiple, FreeSolo, boolean>, "renderInput" | "options" | "renderTags"> {
    options: T[];
    isLoading?: boolean;
    variant?: InputProps["variant"];
    errorMsg?: string;
    renderInputProps?: Omit<InputProps, "variant">;
    renderInputAdornment?: ReactNode;
}

export function SearchAutocomplete<
    T,
    Multiple extends boolean | undefined = false,
    FreeSolo extends boolean | undefined = false,
>(props: SearchAutocompleteProps<T, Multiple, FreeSolo>) {
    const {
        options,
        isLoading,
        variant,
        errorMsg,
        renderInputProps,
        renderInputAdornment,
        renderValue,
        ...autocompleteProps
    } = props;

    const [focus, setFocus] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (options.length === 0) {
            setOpen(false);
        } else if (focus) {
            setOpen(true);
        }
    }, [options, focus]);

    return (
        <>
            <Autocomplete
                disablePortal
                open={open}
                onFocus={() => {
                    setFocus(true);
                    if (!open) setOpen(true);
                }}
                onBlur={() => {
                    setFocus(false);
                    setOpen(false);
                }}
                options={options}
                {...autocompleteProps}
                renderValue={renderValue}
                slotProps={{
                    listbox: {
                        className: "bg-surface-bg text-surface-foreground border-1 border-border",
                    },
                    paper: {
                        className: "bg-surface-bg! border-1 border-border max-w-[300px]",
                    },
                    ...(autocompleteProps.slotProps || {}),
                }}
                renderInput={(params) => {
                    const { type, ...restInputProps } = params.inputProps;
                    return (
                        <div ref={params.InputProps.ref} className="relative">
                            {renderInputAdornment ?? (
                                <span className="text-foreground-muted absolute top-3 left-3 text-base select-none">
                                    <IconSearch />
                                </span>
                            )}
                            <Input
                                {...restInputProps}
                                className="text-foreground pl-8"
                                type="text"
                                {...renderInputProps}
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
            />
            {variant === "error" && errorMsg && <InputErrorMessage errorMsg={errorMsg} />}
        </>
    );
}
