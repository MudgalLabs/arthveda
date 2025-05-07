import { Button } from "@/s8ly";
import { useSidebar } from "@/components/sidebar/sidebar-context";
import { IconImport, IconPlus, IconSidebarToggle } from "@/components/icons";
import { Branding } from "@/components/branding";
import { Link } from "@/components/link";
import { ROUTES } from "@/routes";
import { Tooltip } from "../s8ly/tooltip/tooltip";

export const Topbar = () => {
    const { isOpen, toggleSidebar } = useSidebar();

    return (
        <div className="border-b-accent-muted flex h-full w-full items-center justify-between border-b-1">
            <div className="flex items-baseline">
                <Tooltip
                    content={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
                    delayDuration={0}
                    contentProps={{ side: "right" }}
                >
                    <Button
                        // The 6 margin on the left comes from the Sidebar where the Icon
                        // is rendered at 6 margin from the left.
                        className="mr-8 ml-5"
                        variant="ghost"
                        size="icon"
                        type="button"
                        onClick={toggleSidebar}
                    >
                        <IconSidebarToggle size={24} />
                    </Button>
                </Tooltip>

                <Branding className="hidden sm:inline-flex" size="small" />
            </div>

            <div className="mr-2 inline-flex gap-x-2">
                <Link to={ROUTES.addTrade} unstyled>
                    <Button variant="outline" size="small">
                        <IconPlus size={18} /> Add Trade
                    </Button>
                </Link>

                <Link to={ROUTES.importTrades} unstyled>
                    <Button variant="outline" size="small">
                        <IconImport size={18} />
                        Import Trades
                    </Button>
                </Link>
            </div>
        </div>
    );
};
