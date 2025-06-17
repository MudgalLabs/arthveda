import { Select, SelectOptionItem, SelectProps } from "@/s8ly";

import { apiHooks } from "@/hooks/api_hooks";
import { CurrencyCode } from "@/lib/api/currency";

interface CurrencySelectProps extends Omit<SelectProps, "options"> {
    value?: CurrencyCode;
    onValueChange?: (value: CurrencyCode) => void;
}

function CurrencySelect(props: CurrencySelectProps) {
    const { data, isLoading } = apiHooks.currency.useList();

    const items = data?.data || [];
    const options: SelectOptionItem<CurrencyCode>[] = items.map((i) => ({
        label: `${i.name} (${i.code.toUpperCase()}) ${i.symbol}`,
        value: i.code,
    }));

    options.push({
        value: "-1" as CurrencyCode,
        label: (
            <>
                <p>Don't see your currency here? We are working on supporting more currencies!</p>
            </>
        ),
        disabled: true,
    });

    return <Select loading={isLoading} options={options} {...props} />;
}

export { CurrencySelect };
