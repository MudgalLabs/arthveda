import { FC, memo } from "react";
import { Button, Separator, Tooltip } from "@/s8ly";
import { Loading } from "@/components/loading";
import { useSidebar } from "@/components/sidebar/sidebar_context";
import { IconPanelLeftClose, IconPanelLeftOpen } from "@/components/icons";

interface PageHeadingProps {
    heading: string;
    loading?: boolean;
}

const PageHeading: FC<PageHeadingProps> = memo(({ heading, loading }) => {
    const { isOpen, toggleSidebar } = useSidebar();

    return (
        <div>
            <div className="flex items-center gap-x-2">
                <Tooltip
                    content={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
                    delayDuration={500}
                    contentProps={{ side: "right" }}
                >
                    <Button
                        className="text-text-subtle"
                        variant="ghost"
                        size="icon"
                        type="button"
                        onClick={toggleSidebar}
                    >
                        {isOpen ? <IconPanelLeftClose size={18} /> : <IconPanelLeftOpen size={18} />}
                    </Button>
                </Tooltip>

                <h1 className="heading text-foreground leading-none">{heading}</h1>

                <div>{loading && <Loading />}</div>
            </div>

            <div className="h-4" />
            <Separator />
            <div className="h-4" />
        </div>
    );
});

export { PageHeading };
