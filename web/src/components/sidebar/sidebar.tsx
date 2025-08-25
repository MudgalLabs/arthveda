import { FC, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Popover, IconBell, Tooltip, PopoverTrigger, PopoverContent, Button } from "netra";
import { cn } from "@/lib/utils";
import { Link } from "@/components/link";
import { IconCandlestick, IconDashboard, IconType } from "@/components/icons";

import { useSidebar } from "@/components/sidebar/sidebar_context";
import { useIsMobile } from "@/hooks/use_is_mobile";
import { ROUTES } from "@/constants";
import { ProfileMenu } from "@/components/profile_menu";
import { useAuthentication } from "@/features/auth/auth_context";
import { AddPositionMenu } from "@/features/dashboard/add_position_menu";
import { Branding } from "@/components/branding";

const SIDEBAR_ROUTES = [ROUTES.dashboard, ROUTES.listPositions, ROUTES.newPositions, ROUTES.importPositions];

export const Sidebar = () => {
    const { pathname } = useLocation();
    const { data } = useAuthentication();
    const { isOpen, setIsOpen } = useSidebar();
    const isMobile = useIsMobile();

    const [showNotifications, setShowNotifications] = useState(false);

    const [activeRoute, setActiveRoute] = useState("");
    useEffect(() => {
        setActiveRoute(SIDEBAR_ROUTES.includes(pathname) ? pathname : "");

        if (isMobile) {
            // Close sidebar on route change in mobile view.
            setIsOpen(false);
        }
    }, [pathname, isMobile, setIsOpen]);

    // Make sure sidebar is closed when we load the component on mobile.
    useEffect(() => {
        if (isMobile) {
            setIsOpen(false);
        }
    }, [isMobile, setIsOpen]);

    const navigate = useNavigate();

    const handleClick = (route: string) => {
        navigate(route);
        setActiveRoute(route);
    };

    return (
        <div
            className={cn("relative flex h-full flex-col justify-between px-3", {
                "w-[220px]!": isOpen && !isMobile,
                hidden: !isOpen && isMobile,
            })}
        >
            <div className="mt-6 flex flex-col gap-y-2 pb-2">
                <div className="mb-4">
                    <Branding size="small" hideText={!isOpen || isMobile} hideBetaTag={!isOpen || isMobile} />
                </div>

                <AddPositionMenu sidebarOpen={isOpen} />

                <div className="h-4" />

                <Link to={ROUTES.dashboard} variant="unstyled">
                    <SidebarNavItem
                        label="Dashboard"
                        Icon={IconDashboard}
                        open={isOpen}
                        isActive={activeRoute === ROUTES.dashboard}
                        onClick={() => handleClick(ROUTES.dashboard)}
                    />
                </Link>

                <Link to={ROUTES.listPositions} variant="unstyled">
                    <SidebarNavItem
                        label="Positions"
                        Icon={IconCandlestick}
                        open={isOpen}
                        isActive={activeRoute === ROUTES.listPositions}
                        onClick={() => handleClick(ROUTES.listPositions)}
                    />
                </Link>
            </div>

            <div className="mb-4 space-y-2">
                <Popover open={showNotifications} onOpenChange={setShowNotifications}>
                    <PopoverTrigger className="w-full">
                        <SidebarNavItem
                            label="Notifications"
                            Icon={IconBell}
                            open={isOpen}
                            isActive={showNotifications}
                            onClick={() => setShowNotifications((prev) => !prev)}
                        />
                    </PopoverTrigger>

                    <PopoverContent side="right" align="end" sideOffset={8}>
                        <div className="flex-center h-120 w-100 overflow-y-auto">
                            <p className="text-text-subtle text-sm">No notifications yet, stay tuned!</p>
                        </div>
                    </PopoverContent>
                </Popover>

                {data && (
                    <ProfileMenu
                        sidebarOpen={isOpen}
                        email={data.email}
                        displayName={data.name}
                        profileImageURL={data.avatar_url}
                    />
                )}
            </div>
        </div>
    );
};

interface SidebarNavItemProps {
    label: string;
    Icon: IconType;
    open: boolean;
    isActive: boolean;
    onClick?: () => void;
    isMobile?: boolean;
}

const SidebarNavItem: FC<SidebarNavItemProps> = (props) => {
    const { label, Icon, open, isActive, onClick } = props;
    const isMobile = useIsMobile();

    const content = (
        <div
            className={cn(
                "peer text-text-muted [&_svg]:text-text-muted hover:[&_svg]:text-text-primary w-full rounded-sm bg-transparent p-2 transition-colors",
                {
                    "bg-secondary-hover text-text-primary": isActive,
                    "hover:bg-secondary-hover hover:text-text-primary": !isActive,
                    "flex items-center gap-2 text-base": open && !isMobile,
                    "mx-auto flex h-9 w-9 items-center justify-center": !open || isMobile,
                }
            )}
            onClick={onClick}
        >
            <Icon size={20} />
            {open && !isMobile && <p className="text-sm">{label}</p>}
        </div>
    );

    return (
        <Tooltip content={label} delayDuration={0} contentProps={{ side: "right" }} disabled={open}>
            {content}
        </Tooltip>
    );
};
