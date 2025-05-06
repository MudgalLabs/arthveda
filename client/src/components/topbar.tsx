import { Button } from "@/s8ly";
import { useSidebar } from "@/components/sidebar/sidebar-context";
import { IconImport, IconPlus, IconSidebarToggle } from "@/components/icons";
import { Branding } from "@/components/branding";
import { Link } from "@/components/link";
import { ROUTES } from "@/routes";

export const Topbar = () => {
    const { toggleSidebar } = useSidebar();

    return (
        <div className="border-b-accent-muted flex h-full w-full items-center justify-between border-b-1 py-2">
            <div className="ml-5 flex w-[260px] gap-x-5">
                <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    onClick={toggleSidebar}
                >
                    <IconSidebarToggle size={24} />
                </Button>

                <Branding textSize="24px" logoSize={24} />
            </div>

            <div className="mr-10 inline-flex gap-x-2">
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
