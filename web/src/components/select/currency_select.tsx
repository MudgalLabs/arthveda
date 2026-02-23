import { Select, SelectOptionItem, SelectProps } from "netra";

import { apiHooks } from "@/hooks/api_hooks";
import { CurrencyCode } from "@/lib/api/currency";

interface CurrencySelectProps extends Omit<SelectProps, "options"> {
    value?: CurrencyCode;
    onValueChange?: (value: CurrencyCode) => void;
    onlyFxSupported?: boolean;
}

function CurrencySelect(props: CurrencySelectProps) {
    const { onlyFxSupported = false, ...rest } = props;

    const { data, isLoading } = apiHooks.currency.useList();

    const items = data?.data || [];
    const options: SelectOptionItem<CurrencyCode>[] = items.map((i) => ({
        label: `${i.name} (${i.code.toUpperCase()}) ${i.symbol}`,
        value: i.code,
    }));

    if (onlyFxSupported) {
        options.push({
            value: "" as CurrencyCode,
            label: (
                <div className="text-xs">
                    Don't see your currency here? Tell us what you need{" "}
                    <a className="text-xs!" href="mailto:hey@arthveda.app">
                        hey@arthveda.app
                    </a>
                </div>
            ),
            disabled: true,
        });
    }

    return <Select loading={isLoading} options={options} {...rest} />;
}

export { CurrencySelect };
