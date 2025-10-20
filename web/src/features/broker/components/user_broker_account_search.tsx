import { FC, memo, useMemo, useState } from "react";
import { SearchAutocomplete } from "@/components/search_autocomplete";
import { InputProps } from "netra";
import { apiHooks } from "@/hooks/api_hooks";
import { BrokerLogo } from "@/components/broker_logo";
import { useControlled } from "@/hooks/use_controlled";
import { cn } from "@/lib/utils";
import { useBroker } from "@/features/broker/broker_context";
import { UserBrokerAccountSearchValue } from "@/features/position/position";
import { Link } from "@/components/link";
import { ROUTES } from "@/constants";
import { isObject } from "lodash";

interface UserBrokerAccountSearchProps extends Omit<InputProps, "value" | "onChange"> {
    value?: UserBrokerAccountSearchValue | null;
    onChange?: (value: UserBrokerAccountSearchValue | null) => void;
    filters?: {
        brokerId?: string;
    };
}

export const UserBrokerAccountSearch: FC<UserBrokerAccountSearchProps> = memo((props) => {
    const { filters = {}, value: valueProp, onChange: onChangeProp, variant, errorMsg, ...restProps } = props;

    const [inputValue, setInputValue] = useState("");
    const { data, isLoading } = apiHooks.userBrokerAccount.useList();

    const options = useMemo(() => {
        if (!data || !data.data) return [];
        let filtered = data.data;
        if (filters.brokerId) {
            filtered = filtered.filter((option) => option.broker_id === filters.brokerId);
        }
        if (inputValue) {
            filtered = filtered.filter((option) => option.name.toLowerCase().includes(inputValue.toLowerCase()));
        }
        return filtered;
    }, [data, filters.brokerId, inputValue]);

    const [value, setValue] = useControlled<UserBrokerAccountSearchValue | null>({
        controlled: valueProp,
        default: null,
        name: "value",
    });

    const { getBrokerNameById } = useBroker();

    return (
        <SearchAutocomplete<UserBrokerAccountSearchValue>
            inputValue={inputValue}
            onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
            value={value}
            onChange={(_, newValue) => {
                if (typeof newValue === "string") return;
                setValue(newValue);
                onChangeProp?.(newValue);
            }}
            options={options}
            isLoading={isLoading}
            variant={variant}
            errorMsg={errorMsg}
            renderInputProps={restProps}
            getOptionLabel={(option) =>
                isObject(option) ? `${option.name} (${getBrokerNameById(option.broker_id)})` : ""
            }
            noOptionsText={
                <span className="text-foreground-muted text-sm">
                    No broker account{filters.brokerId ? ` for ${getBrokerNameById(filters.brokerId)}` : ""}. You can
                    manage your broker accounts <Link to={ROUTES.brokerAccounts}>here</Link>.
                </span>
            }
            filterOptions={(opts) => opts}
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
    );
});
