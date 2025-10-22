import {
    IconChartPie,
    PageHeading,
    useDocumentTitle,
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
    useURLState,
} from "netra";

import { AnalyticsTags } from "@/features/analytics/components/analytics_tags";

const enum AnlyticsTab {
    Tags = "tags",
    Time = "time",
    Symbols = "symbols",
    Instruments = "instruments",
}

export function Analytics() {
    useDocumentTitle("Analytics • Arthveda");

    const [tab, setTab] = useURLState<string>("tab", AnlyticsTab.Tags);

    return (
        <div className="flex h-full flex-col">
            <PageHeading>
                <IconChartPie size={18} />
                <h1>Analytics</h1>
            </PageHeading>

            <Tabs defaultValue="trades" value={tab} onValueChange={setTab}>
                <TabsList>
                    <TabsTrigger value="tags">Tags</TabsTrigger>
                    <TabsTrigger value="time">Time</TabsTrigger>
                    <TabsTrigger value="symbols">Symbols</TabsTrigger>
                    <TabsTrigger value="instruments">Instruments</TabsTrigger>
                </TabsList>

                <div className="h-8" />

                <TabsContent value="tags">
                    <AnalyticsTags />
                </TabsContent>

                <TabsContent value="time">
                    <AnalyticsComingSoon dimension="Time" />
                </TabsContent>

                <TabsContent value="symbols">
                    <AnalyticsComingSoon dimension="Symbols" />
                </TabsContent>

                <TabsContent value="instruments">
                    <AnalyticsComingSoon dimension="Instruments" />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function AnalyticsComingSoon({ dimension }: { dimension: string }) {
    return <div className="text-muted-foreground py-8 text-center">Analytics based on {dimension} coming soon</div>;
}

export default Analytics;
