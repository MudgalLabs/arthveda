import { Select, SelectOptionItem, SelectProps } from "@/s8ly";

import { CurrencyCode } from "@/features/position/position";
import { apiHooks } from "@/hooks/api_hooks";
import { apiErrorHandler } from "@/lib/api";

function CurrencySelect(props: Omit<SelectProps, "options">) {
    const { data, isLoading, error, isError } = apiHooks.currency.useList();

    if (isError) {
        apiErrorHandler(error);
    }

    const items = data?.data || [];
    const options: SelectOptionItem[] = items.map((i) => ({
        label: `${i.name} (${i.code.toUpperCase()}) ${i.symbol}`,
        value: i.code,
    }));

    options.push({
        value: "none" as CurrencyCode,
        label: (
            <>
                <p>
                    Don't see your currency here? We are working on supporting
                    more currencies!
                </p>
            </>
        ),
        disabled: true,
    });

    return <Select loading={isLoading} options={options} {...props} />;
}

export { CurrencySelect };
