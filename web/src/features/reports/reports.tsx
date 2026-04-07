import { PageHeading, useDocumentTitle } from "netra";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/s8ly";
import { IconClipboardList } from "@/components/icons";
import { ReportsTags } from "@/features/reports/components/reports_tags";
import { ReportsTimeframes } from "@/features/reports/components/reports_timeframes";
import { ReportsSymbols } from "@/features/reports/components/reports_symbols";
import { useURLState } from "@/hooks/use_url_state";
import { ReportsInstruments } from "@/features/reports/components/reports_instruments";

const enum ReportsTab {
    Symbols = "symbols",
    Instruments = "instruments",
    Tags = "tags",
    Timeframes = "timeframes",
}

export function Reports() {
    useDocumentTitle("Reports • Arthveda");

    const [tab, setTab] = useURLState<string>("tab", ReportsTab.Symbols);

    return (
        <div className="flex h-full flex-col">
            <PageHeading>
                <IconClipboardList size={18} />
                <h1>Reports</h1>
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
                    <ReportsSymbols />
                </TabsContent>

                <TabsContent value="instruments">
                    <ReportsInstruments />
                </TabsContent>

                <TabsContent value="timeframes">
                    <ReportsTimeframes />
                </TabsContent>

                <TabsContent value="tags">
                    <ReportsTags />
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default Reports;
