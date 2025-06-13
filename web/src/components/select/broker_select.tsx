import { Select, SelectOptionItem, SelectProps } from "@/s8ly";

import { apiHooks } from "@/hooks/api_hooks";

function BrokerSelect(props: Omit<SelectProps, "options">) {
    const { data, isLoading } = apiHooks.broker.useList();

    const items = data?.data || [];
    const options: SelectOptionItem[] = items.map((i) => ({
        label: i.name,
        value: i.id,
    }));

    options.push({
        value: "-1",
        label: (
            <>
                <p>
                    Don't see your broker here? We are working on supporting
                    more brokers!
                </p>
            </>
        ),
        disabled: true,
    });

    return <Select loading={isLoading} options={options} {...props} />;
}

export { BrokerSelect };
