import { useMemo } from "react";
import { ErrorMessage, LoadingScreen, PageHeading, useDocumentTitle, useIsMobile } from "netra";
import Decimal from "decimal.js";

import { IconBulb, IconSparkles } from "@/components/icons";
import { apiHooks } from "@/hooks/api_hooks";
import { Insight, InsightToken } from "@/lib/api/insight";
import { Card, CardTitle } from "@/components/card";
import { formatCurrency } from "@/lib/utils";
import { CurrencyCode } from "@/lib/api/currency";
import { useHomeCurrency } from "@/features/auth/auth_context";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/s8ly";
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

                <div className="h-6" />

                {sections.map((section) => (
                    <TabsContent key={section.key} value={section.key}>
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

            <div className="h-4" />

            {content}
        </div>
    );
}

function InsightsSection({ insights }: { insights: Insight[] }) {
    const isMobile = useIsMobile();

    const goodInsights = insights.filter((i) => i.direction === "positive");
    const badInsights = insights.filter((i) => i.direction === "negative");
    const pairs = pairInsights(goodInsights, badInsights);

    if (isMobile) {
        return (
            <div className="space-y-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <span className="bg-text-destructive-2 h-2 w-2 rounded-full" />
                        <h2 className="section-heading-muted">What's hurting</h2>
                    </div>

                    {badInsights.map((insight) => (
                        <InsightCard key={insight.type} insight={insight} />
                    ))}
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <span className="bg-success-foreground-2 h-2 w-2 rounded-full" />
                        <h2 className="section-heading-muted">What's working</h2>
                    </div>

                    {goodInsights.map((insight) => (
                        <InsightCard key={insight.type} insight={insight} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center gap-2">
                    <span className="bg-success-foreground-2 h-2 w-2 rounded-full" />
                    <h2 className="section-heading-muted">What's working</h2>
                </div>

                <div className="flex items-center gap-2">
                    <span className="bg-text-destructive-2 h-2 w-2 rounded-full" />
                    <h2 className="section-heading-muted">What's hurting</h2>
                </div>
            </div>

            {pairs.map((pair, i) => (
                <div key={i} className="grid grid-cols-2 gap-6">
                    <div>{pair.good && <InsightCard insight={pair.good} />}</div>
                    <div>{pair.bad && <InsightCard insight={pair.bad} />}</div>
                </div>
            ))}
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
                    isPositive ? "bg-success-foreground-2/70" : "bg-text-destructive-2/70"
                }`}
            />

            <div className="flex-1 space-y-3">
                <CardTitle className="leading-snug">{insight.title}</CardTitle>

                <p className="text-text-muted text-sm leading-relaxed">
                    {renderDescription(insight.description, insight.tokens, homeCurrency)}
                </p>
            </div>

            <div className="text-text-muted mt-3 flex items-center gap-1.5 text-xs">
                <IconBulb size={14} />
                <span>{insight.action}</span>
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
            return `${new Decimal(token.value).toFixed(1)}%`;

        case "text":
        default:
            return String(token.value);
    }
}

function pairInsights(good: Insight[] = [], bad: Insight[] = []) {
    const max = Math.max(good.length, bad.length);

    return Array.from({ length: max }).map((_, i) => ({
        good: good[i],
        bad: bad[i],
    }));
}
