import { FC, memo } from "react";
import { Button, Separator, Tooltip } from "netra";

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
        <div className="flex-x">
            <Tooltip
                content={isOpen ? "Collapse sidebar" : "Expand sidebar"}
                delayDuration={500}
                contentProps={{ side: "right" }}
            >
                <Button className="text-text-subtle" variant="ghost" size="icon" type="button" onClick={toggleSidebar}>
                    {isOpen ? <IconPanelLeftClose size={20} /> : <IconPanelLeftOpen size={20} />}
                </Button>
            </Tooltip>

            <Separator orientation="vertical" className="mr-1 h-8!" />

            <h1 className="sub-heading">{heading}</h1>

            <div>{loading && <Loading />}</div>
        </div>
    );
});

export { PageHeading };
