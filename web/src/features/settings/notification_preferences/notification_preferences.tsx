import { useListPreferences, useSetPreference } from "@/bodhveda/react";

import { PageHeading } from "@/components/page_heading";
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbSeparator,
    BreadcrumbPage,
    IconSettings,
    Loading,
    Switch,
    Label,
} from "netra";
import { useMemo } from "react";

export default function NotificationPreferences() {
    const { data, isFetching: isFetchingPreferences, isError } = useListPreferences();
    const { mutate: setPreference, isPending: isSettingPreference } = useSetPreference();

    const renderPreferences = useMemo(() => {
        if (isError) {
            return <p className="text-text-destructive">Failed to load preferences. Please try again.</p>;
        }

        if (!data) return null;

        return (
            <ul className="border-border-subtle mx-auto max-w-xl rounded-md border-1 p-2">
                {data.preferences.map((preference, index) => {
                    return (
                        <li key={index} className="flex-x justify-between py-2">
                            <Label htmlFor={preference.target.label}>{preference.target.label}</Label>

                            <Switch
                                id={preference.target.label}
                                defaultChecked={preference.state.enabled}
                                onCheckedChange={(checked) =>
                                    setPreference({
                                        target: preference.target,
                                        state: { enabled: checked },
                                    })
                                }
                                disabled={isFetchingPreferences || isSettingPreference}
                            />
                        </li>
                    );
                })}
            </ul>
        );
    }, [data, isError, isFetchingPreferences, isSettingPreference]);

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
                            <BreadcrumbPage>Notifications</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                {isFetchingPreferences && <Loading />}
            </PageHeading>

            <div className="h-4" />

            {renderPreferences}
        </>
    );
}
