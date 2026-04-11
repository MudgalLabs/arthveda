import { useMemo } from "react";
import { ErrorMessage, LoadingScreen, PageHeading, useDocumentTitle } from "netra";
import Decimal from "decimal.js";

import { IconSparkles } from "@/components/icons";
import { apiHooks } from "@/hooks/api_hooks";
import { Insight, InsightToken } from "@/lib/api/insight";
import { Card, CardTitle } from "@/components/card";
import { formatCurrency } from "@/lib/utils";
import { CurrencyCode } from "@/lib/api/currency";
import { useHomeCurrency } from "@/features/auth/auth_context";
import { Tabs, TabsList, TabsTrigger, TabsContent, Tag } from "@/s8ly";
import { useURLState } from "@/hooks/use_url_state";

export default function Insights() {
    useDocumentTitle("Insights • Arthveda");

    const [tab, setTab] = useURLState<string>("tab", "time_of_day");

    const { data, isLoading } = apiHooks.insight.useGetInsights();

    const content = useMemo(() => {
        if (isLoading) return <LoadingScreen />;

        if (!data) {
            return <ErrorMessage errorMsg="Failed to load Insights" />;
        }

        const sections = data.sections;

        if (!sections?.length) {
            return <ErrorMessage errorMsg="No insights available" />;
        }

        return (
            <Tabs value={tab} onValueChange={setTab}>
                <TabsList>
                    {sections.map((section) => (
                        <TabsTrigger key={section.key} value={section.key}>
                            {section.title}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <div className="h-4" />

                {sections.map((section) => (
                    <TabsContent key={section.key} value={section.key} className="pb-12">
                        <p className="text-muted-foreground flex-x mb-6 gap-x-1! text-sm">{section.description}</p>

                        <InsightsSection insights={section.insights} />
                    </TabsContent>
                ))}
            </Tabs>
        );
    }, [data, isLoading, tab]);

    return (
        <div className="flex h-full flex-col">
            <PageHeading>
                <IconSparkles size={18} />
                <h1>Insights</h1>
            </PageHeading>

            {content}
        </div>
    );
}

function InsightsSection({ insights }: { insights: Insight[] }) {
    const goodInsights = insights.filter((i) => i.direction === "positive");
    const badInsights = insights.filter((i) => i.direction === "negative");

    return (
        <div className="space-y-10">
            {badInsights.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <span className="bg-text-destructive-2 h-2 w-2 rounded-full" />
                        <h2 className="section-heading-muted">What's hurting</h2>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {badInsights.map((insight) => (
                            <InsightCard key={insight.type} insight={insight} />
                        ))}
                    </div>
                </div>
            )}

            {goodInsights.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <span className="bg-success-foreground-2 h-2 w-2 rounded-full" />
                        <h2 className="section-heading-muted">What's working</h2>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {goodInsights.map((insight) => (
                            <InsightCard key={insight.type} insight={insight} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export function InsightCard({ insight }: { insight: Insight }) {
    const homeCurrency = useHomeCurrency();
    const isPositive = insight.direction === "positive";

    return (
        <Card className="relative flex h-full flex-col overflow-hidden p-4">
            <div
                className={`absolute top-0 left-0 h-full w-[3px] ${
                    isPositive ? "bg-success-foreground-2/50" : "bg-text-destructive-2/50"
                }`}
            />

            <div className="flex-1 space-y-3">
                <CardTitle className="line-clamp-2 leading-snug">{insight.title}</CardTitle>

                <p className="text-text-muted text-sm leading-6">
                    {renderDescription(insight.description, insight.tokens, homeCurrency)}
                </p>

                <Tag variant="muted" size="small">
                    <span>{insight.action}</span>
                </Tag>
            </div>
        </Card>
    );
}

export function renderDescription(template: string, tokens: Record<string, InsightToken>, homeCurrency: CurrencyCode) {
    const parts = template.split(/(\{\w+\})/g);

    return parts.map((part, i) => {
        const match = part.match(/\{(\w+)\}/);

        if (!match) return <span key={i}>{part}</span>;

        const token = tokens[match[1]];
        if (!token) return null;

        return (
            <span key={i} className={getTokenToneClass(token.tone)}>
                {formatToken(token, homeCurrency)}
            </span>
        );
    });
}

function getTokenToneClass(tone: InsightToken["tone"]) {
    switch (tone) {
        case "positive":
            return "text-success-foreground-2 font-medium";
        case "negative":
            return "text-text-destructive-2 font-medium";
        default:
            return "";
    }
}

export function formatToken(token: InsightToken, homeCurrency: CurrencyCode): string {
    switch (token.type) {
        case "currency":
            return formatCurrency(new Decimal(token.value).toFixed(2), {
                precision: 0,
                currency: homeCurrency,
            });

        case "percentage":
            return `${new Decimal(token.value).toDecimalPlaces(0)}%`;

        case "text":
        default:
            return String(token.value);
    }
}
