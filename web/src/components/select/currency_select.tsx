import { Select, SelectOptionItem, SelectProps, useControlled } from "netra";

import { apiHooks } from "@/hooks/api_hooks";
import { CurrencyCode } from "@/lib/api/currency";

interface CurrencySelectProps extends Omit<SelectProps, "options"> {
    value?: CurrencyCode;
    onValueChange?: (value: CurrencyCode) => void;
    onlyFxSupported?: boolean;
}

function CurrencySelect(props: CurrencySelectProps) {
    const { value: valueProp, onValueChange, defaultValue, classNames, onlyFxSupported = false, ...rest } = props;

    const [value, setValue] = useControlled({
        controlled: valueProp,
        default: defaultValue,
        name: "CurrencySelect",
    });

    const { data, isLoading } = apiHooks.currency.useList();

    const items = data?.data || [];
    const options: SelectOptionItem<CurrencyCode>[] = items.map((i) => {
        return {
            label: i.code,
            value: i.code,
        };
    });

    return (
        <Select
            classNames={{
                trigger: "w-20!",
                content: "w-20!",
                ...classNames,
            }}
            loading={isLoading}
            options={options}
            value={value}
            onValueChange={onValueChange ?? setValue}
            {...rest}
        />
    );
}

export { CurrencySelect };
