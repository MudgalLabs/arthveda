import { Button } from "@/s8ly";
import { useSidebar } from "@/components/sidebar/sidebar_context";
import { IconSidebarToggle } from "@/components/icons";
import { Branding } from "@/components/branding";
import { Link } from "@/components/link";
import { Tooltip } from "@/s8ly";
import { ROUTES } from "@/routes_constants";

export const Topbar = () => {
    const { isOpen, toggleSidebar } = useSidebar();

    return (
        <div className="border-b-border flex h-full w-full items-center justify-between border-b-1">
            <div className="mr-4 flex w-full items-baseline justify-between sm:justify-start">
                <Tooltip
                    content={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
                    delayDuration={0}
                    contentProps={{ side: "right" }}
                >
                    <Button
                        // The 6 margin on the left comes from the Sidebar where the Icon
                        // is rendered at 6 margin from the left.
                        className="mr-8 ml-5"
                        variant="secondary"
                        size="icon"
                        type="button"
                        onClick={toggleSidebar}
                    >
                        <IconSidebarToggle size={24} />
                    </Button>
                </Tooltip>

                <Link to={ROUTES.dashboard} variant="unstyled">
                    <Branding size="small" />
                </Link>
            </div>
        </div>
    );
};
