import { ReactNode, useMemo, useState } from "react";
import {
    PageHeading,
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbSeparator,
    BreadcrumbPage,
    IconSettings,
    Tooltip,
    useDocumentTitle,
    Loading,
    LoadingScreen,
} from "netra";

import { CurrencySelect } from "@/components/select/currency_select";
import { ContactEmail } from "@/components/contact_email";
import { useHomeCurrency } from "@/features/auth/auth_context";
import { apiHooks } from "@/hooks/api_hooks";
import { apiErrorHandler } from "@/lib/api";
import { toast } from "@/components/toast";

export function Settings() {
    useDocumentTitle("Settings • Arthveda");

    const homeCurrency = useHomeCurrency();
    const [currency, setCurrency] = useState(homeCurrency);

    const { data, isLoading: isLoadingCanUpdaeHomeCurrency } = apiHooks.user.useCanUpdateHomeCurrency();
    const canUpdateHomeCurrency = data?.data?.can_update || false;

    const { mutate: updateHomeCurrency } = apiHooks.user.useUpdateHomeCurrency({
        onSuccess: () => {
            toast.success("Home currency updated", {
                duration: 2000,
            });
        },
        onError: apiErrorHandler,
    });

    const content = useMemo(() => {
        if (isLoadingCanUpdaeHomeCurrency) return <LoadingScreen />;

        return (
            <ul className="bg-surface-2 border-border-subtle mx-auto max-w-3xl rounded-md border-1 p-3">
                <SettingItem
                    title="Home Currency"
                    description={
                        <div className="space-y-1">
                            <p>All positions, P&L, and analytics are displayed in this currency.</p>
                            <p>
                                If positions exist in multiple currencies, values will be converted to your home
                                currency.
                            </p>
                        </div>
                    }
                >
                    <Tooltip
                        disabled={canUpdateHomeCurrency}
                        content={
                            <div className="text-text-muted text-xs">
                                <p>
                                    Your home currency can't be changed because you have positions in multiple
                                    currencies.
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
                            <CurrencySelect
                                disabled={!canUpdateHomeCurrency}
                                value={currency}
                                onValueChange={(v) => {
                                    setCurrency(v);
                                    updateHomeCurrency(v);
                                }}
                            />
                        </span>
                    </Tooltip>
                </SettingItem>
            </ul>
        );
    }, [isLoadingCanUpdaeHomeCurrency, currency, canUpdateHomeCurrency]);

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

                {isLoadingCanUpdaeHomeCurrency && <Loading />}
            </PageHeading>

            <div className="h-4" />

            {content}
        </>
    );
}

export default Settings;

interface SettingItemProps {
    children: ReactNode;
    title: string;
    description?: ReactNode;
}

function SettingItem(props: SettingItemProps) {
    const { children, title, description = "" } = props;

    return (
        <div className="flex-x justify-between">
            <div className="space-y-2">
                <h2 className="text-base font-medium">{title}</h2>
                <div className="text-text-muted">{description}</div>
            </div>

            <div>{children}</div>
        </div>
    );
}
