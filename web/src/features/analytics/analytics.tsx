import { PageHeading, useDocumentTitle, Tabs, TabsList, TabsTrigger, TabsContent } from "netra";

import { IconBrain } from "@/components/icons";
import { AnalyticsTags } from "@/features/analytics/components/analytics_tags";
import { AnalyticsTime } from "@/features/analytics/components/analytics_time";
import { AnalyticsSymbols } from "@/features/analytics/components/analytics_symbols";
import { useURLState } from "@/hooks/use_url_state";

const enum AnalyticsTab {
    Symbols = "symbols",
    Instruments = "instruments",
    Tags = "tags",
    Timeframes = "timeframes",
}

export function Analytics() {
    useDocumentTitle("Analytics • Arthveda");

    const [tab, setTab] = useURLState<string>("tab", AnalyticsTab.Symbols);

    return (
        <div className="flex h-full flex-col">
            <PageHeading>
                <IconBrain size={18} />
                <h1>Analytics</h1>
            </PageHeading>

            <Tabs defaultValue="trades" value={tab} onValueChange={setTab} className="pb-8">
                <TabsList>
                    <TabsTrigger value="symbols">Symbols</TabsTrigger>
                    <TabsTrigger value="instruments">Instruments</TabsTrigger>
                    <TabsTrigger value="timeframes">Timeframes</TabsTrigger>
                    <TabsTrigger value="tags">Tags</TabsTrigger>
                </TabsList>

                <div className="h-8" />

                <TabsContent value="symbols">
                    <AnalyticsSymbols />
                </TabsContent>

                <TabsContent value="instruments">
                    <AnalyticsComingSoon dimension="Instruments" />
                </TabsContent>

                <TabsContent value="timeframes">
                    <AnalyticsTime />
                </TabsContent>

                <TabsContent value="tags">
                    <AnalyticsTags />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function AnalyticsComingSoon({ dimension }: { dimension: string }) {
    return <div className="text-muted-foreground py-8 text-center">Analytics based on {dimension} coming soon</div>;
}

export default Analytics;
