import { PageHeading, useDocumentTitle } from "netra";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/s8ly";
import { IconBrain } from "@/components/icons";
import { AnalyticsTags } from "@/features/analytics/components/analytics_tags";
import { AnalyticsTimeframes } from "@/features/analytics/components/analytics_timeframes";
import { AnalyticsSymbols } from "@/features/analytics/components/analytics_symbols";
import { useURLState } from "@/hooks/use_url_state";
import { AnalyticsInstruments } from "@/features/analytics/components/analytics_instruments";

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
                    <AnalyticsInstruments />
                </TabsContent>

                <TabsContent value="timeframes">
                    <AnalyticsTimeframes />
                </TabsContent>

                <TabsContent value="tags">
                    <AnalyticsTags />
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default Analytics;
