import { Select, SelectOptionItem, SelectProps } from "netra";

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
            <div className="text-xs">
                Don't see your broker here? Tell us what you need{" "}
                <a className="text-xs!" href="mailto:hey@arthveda.app">
                    hey@arthveda.app
                </a>
            </div>
        ),
        disabled: true,
    });

    return <Select loading={isLoading} options={options} placeholder="Choose Broker" {...props} />;
}

export { BrokerSelect };
