import { FC, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Tooltip } from "@/s8ly/tooltip/tooltip";
import { cn } from "@/lib/utils";
import { Link } from "@/components/link";
import { IconDashboard, IconImport, IconPlus, IconTrades, IconType } from "@/components/icons";

import { useSidebar } from "@/components/sidebar/sidebar_context";
import { useIsMobile } from "@/hooks/use_is_mobile";
import { ROUTES } from "@/routes_constants";

const sidebarRoutes = [ROUTES.dashboard, ROUTES.explorePositions, ROUTES.addPosition, ROUTES.importPositions];

export const Sidebar = () => {
    const { pathname } = useLocation();
    const { isOpen, setIsOpen } = useSidebar();
    const isMobile = useIsMobile();

    const [activeRoute, setActiveRoute] = useState("");
    useEffect(() => {
        setActiveRoute(sidebarRoutes.includes(pathname) ? pathname : "");

        if (isMobile) {
            // Close sidebar on route change in mobile view.
            setIsOpen(false);
        }
    }, [pathname, isMobile, setIsOpen]);

    // Make sure sidebar is closed when we load the component on mobile.
    useEffect(() => setIsOpen(false), [isMobile, setIsOpen]);

    const navigate = useNavigate();

    const handleClick = (route: string) => {
        navigate(route);
        setActiveRoute(route);
    };

    return (
        <div
            className={cn(
                "bg-background border-r-border relative flex h-full flex-col justify-between border-r-1 px-3",
                {
                    "min-w-[280px]!": isOpen,
                    "min-w-fit": !isOpen,
                    hidden: isMobile && !isOpen, // On mobile, we don't show the sidebar when it's closed
                    "w-screen": isMobile && isOpen,
                }
            )}
        >
            <div>
                <div className="mt-4 flex flex-col gap-y-2 pb-2">
                    <Link to={ROUTES.dashboard} variant="unstyled">
                        <SidebarNavItem
                            label="Dashboard"
                            Icon={IconDashboard}
                            open={isOpen}
                            isActive={activeRoute === ROUTES.dashboard}
                            onClick={() => handleClick(ROUTES.dashboard)}
                        />
                    </Link>

                    <Link to={ROUTES.explorePositions} variant="unstyled">
                        <SidebarNavItem
                            label="Explore Positions"
                            Icon={IconTrades}
                            open={isOpen}
                            isActive={activeRoute === ROUTES.explorePositions}
                            onClick={() => handleClick(ROUTES.explorePositions)}
                        />
                    </Link>

                    <Link to={ROUTES.addPosition} variant="unstyled">
                        <SidebarNavItem
                            label="Add Position"
                            Icon={IconPlus}
                            open={isOpen}
                            isActive={activeRoute === ROUTES.addPosition}
                            onClick={() => handleClick(ROUTES.addPosition)}
                        />
                    </Link>

                    <Link to={ROUTES.importPositions} variant="unstyled">
                        <SidebarNavItem
                            label="Import Positions"
                            Icon={IconImport}
                            open={isOpen}
                            isActive={activeRoute === ROUTES.importPositions}
                            onClick={() => handleClick(ROUTES.importPositions)}
                        />
                    </Link>
                </div>
            </div>

            {/* {data && (
                <div
                    className={cn("flex flex-col gap-y-2 pb-2", {
                        "items-center": !isOpen,
                    })}
                >
                    <SidebarProfileMenu
                        sidebarOpen={isOpen}
                        setActiveRoute={setActiveRoute}
                        email={data.email}
                        displayName={data.name}
                        profileImageURL={data.avatar_url}
                        isMobile={isMobile}
                    />
                </div>
            )} */}
        </div>
    );
};

interface SidebarNavItemProps {
    label: string;
    Icon: IconType;
    open: boolean;
    isActive: boolean;
    onClick?: () => void;
}

const SidebarNavItem: FC<SidebarNavItemProps> = (props) => {
    const { label, Icon, open, isActive, onClick } = props;

    const content = (
        <div
            className={cn(
                "text-muted-foreground w-full rounded-md border-l-[4px] border-transparent bg-transparent p-3",
                {
                    "bg-accent-muted text-foreground border-l-primary border-l-[4px]": isActive,
                    "hover:bg-accent-muted hover:text-muted-foreground hover:cursor-pointer": !isActive,
                    "flex items-center gap-3 text-base": open,
                }
            )}
            onClick={onClick}
        >
            <Icon size={24} />
            {open && <p className="font-normal">{label}</p>}
        </div>
    );

    return (
        <Tooltip content={label} delayDuration={0} contentProps={{ side: "right" }} disabled={open}>
            {content}
        </Tooltip>
    );
};
