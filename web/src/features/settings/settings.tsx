import { ReactNode } from "react";
import {
    PageHeading,
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbSeparator,
    BreadcrumbPage,
    IconSettings,
    Tooltip,
} from "netra";

import { CurrencySelect } from "@/components/select/currency_select";
import { ContactEmail } from "@/components/contact_email";
import { useHomeCurrency } from "@/features/auth/auth_context";

export function Settings() {
    const currency = useHomeCurrency();

    return (
        <>
            <PageHeading>
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbPage className="text-text-muted flex-x">
                                <IconSettings size={18} />
                                Settings
                            </BreadcrumbPage>
                        </BreadcrumbItem>

                        <BreadcrumbSeparator />

                        <BreadcrumbItem>
                            <BreadcrumbPage>General</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </PageHeading>

            <div className="h-4" />

            <ul className="border-border-subtle mx-auto max-w-3xl rounded-md border-1 px-4 py-3">
                <SettingItem
                    title="Home Currency"
                    description="All positions, P&L, and analytics will be converted and displayed in this currency."
                >
                    <Tooltip
                        content={
                            <div className="text-text-muted text-xs">
                                <p>
                                    Your home currency is permanent in order to keep the data consistent across multiple
                                    currencies, if any.
                                </p>
                                <br />
                                <p>
                                    For help contact <ContactEmail />
                                </p>
                            </div>
                        }
                        contentProps={{ side: "bottom" }}
                    >
                        <span>
                            <CurrencySelect disabled value={currency} />
                        </span>
                    </Tooltip>
                </SettingItem>
            </ul>
        </>
    );
}

export default Settings;

interface SettingItemProps {
    children: ReactNode;
    title: string;
    description?: string;
}

function SettingItem(props: SettingItemProps) {
    const { children, title, description = "" } = props;

    return (
        <div className="flex-x justify-between gap-x-8">
            <div className="space-y-2">
                <h2 className="text-[16px] font-medium">{title}</h2>
                <p className="text-text-muted">{description}</p>
            </div>

            <div>{children}</div>
        </div>
    );
}
