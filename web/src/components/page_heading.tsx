import { FC, memo } from "react";
import { Button, Separator, Tooltip } from "netra";

import { useSidebar } from "@/components/sidebar/sidebar_context";
import { IconPanelLeftClose, IconPanelLeftOpen } from "@/components/icons";

interface PageHeadingProps {
    children?: React.ReactNode;
}

const PageHeading: FC<PageHeadingProps> = memo(({ children }) => {
    const { isOpen, toggleSidebar } = useSidebar();

    return (
        <>
            <div className="flex-x text-[16px] font-medium">
                <Tooltip
                    content={isOpen ? "Collapse sidebar" : "Expand sidebar"}
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

                <Separator orientation="vertical" className="mr-1 h-6!" />

                {children}
            </div>

            <Separator className="mt-2 mb-3" />
        </>
    );
});

export { PageHeading };
