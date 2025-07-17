import { FC, memo, useEffect, useMemo, useState } from "react";
import Autocomplete from "@mui/material/Autocomplete";

import { Input, InputProps } from "@/s8ly";
import { apiHooks } from "@/hooks/api_hooks";
import { BrokerLogo } from "@/components/broker_logo";
import { useControlled } from "@/hooks/use_controlled";
import { IconSearch } from "@/components/icons";
import { Loading } from "@/components/loading";
import { cn } from "@/lib/utils";
import { InputErrorMessage } from "@/components/input_error_message";
import { useBroker } from "@/features/broker/broker_context";
import { UserBrokerAccountSearchValue } from "@/features/position/position";
import { Link } from "@/components/link";
import { ROUTES } from "@/constants";

interface UserBrokerAccountSearchProps extends Omit<InputProps, "value" | "onChange"> {
    value?: UserBrokerAccountSearchValue | null;
    onChange?: (value: UserBrokerAccountSearchValue | null) => void;
    filters?: {
        // Show Broker Accounts only for broker with this ID.
        brokerId?: string;
    };
}

export const UserBrokerAccountSearch: FC<UserBrokerAccountSearchProps> = memo((props) => {
    const { filters = {}, value: valueProp, onChange: onChangeProp, variant, errorMsg, ...restProps } = props;

    const [inputValue, setInputValue] = useState("");

    const { data, isLoading } = apiHooks.userBrokerAccount.useList();

    const options = useMemo(() => {
        if (!data || !data.data) return [];
        return data.data;
    }, [data]);

    const [value, setValue] = useControlled<UserBrokerAccountSearchValue | null>({
        controlled: valueProp,
        default: null,
        name: "value",
    });

    const [focus, setFocus] = useState(false);
    const [open, setOpen] = useState(false);

    const handleChange = (newValue: UserBrokerAccountSearchValue | null) => {
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

    const { getBrokerNameById } = useBroker();

    return (
        <>
            <Autocomplete
                inputValue={inputValue}
                onInputChange={(_, newInputValue) => {
                    setInputValue(newInputValue);
                }}
                value={value}
                onChange={(_, newValue) => handleChange(newValue)}
                disablePortal
                open={open}
                onFocus={handleFocus}
                onBlur={handleBlur}
                options={options}
                filterOptions={(options) => {
                    // If brokerId is not provided in filters, return all options.
                    let filtered = options;

                    // Show Broker Accounts only for broker with this ID.
                    if (filters.brokerId) {
                        filtered = options.filter((option) => option.broker_id === filters.brokerId);
                    }

                    if (inputValue && value === null) {
                        filtered = filtered.filter((option) =>
                            option.name.toLowerCase().includes(inputValue.toLowerCase())
                        );
                    }

                    return filtered;
                }}
                getOptionLabel={(option) => `${option.name} (${getBrokerNameById(option.broker_id)})`}
                noOptionsText={
                    <span className="text-foreground-muted text-sm">
                        No broker account{filters.brokerId ? ` for ${getBrokerNameById(filters.brokerId)}` : ""}. You
                        can manage your broker accounts <Link to={ROUTES.brokerAccounts}>here</Link>.
                    </span>
                }
                slotProps={{
                    listbox: {
                        className: "bg-surface-bg text-surface-foreground border-1 border-border",
                    },
                    paper: {
                        className: "bg-surface-bg! border-1 border-border max-w-[300px]",
                    },
                }}
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
                            <div className="flex-x">
                                <BrokerLogo brokerId={option.broker_id} />
                                <p className="text-sm!">{option.name}</p>
                            </div>
                        </li>
                    );
                }}
            />

            {variant === "error" && errorMsg && <InputErrorMessage errorMsg={errorMsg} />}
        </>
    );
});
