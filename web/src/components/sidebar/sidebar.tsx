import { FC, ReactNode, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useNotificationsUnreadCount } from "@bodhveda/react";

import { useSidebar, Popover, IconBell, Tooltip, PopoverTrigger, PopoverContent, IconCalendarSingle } from "netra";
import { cn } from "@/lib/utils";
import { Link } from "@/components/link";
import { IconCandlestick, IconDashboard } from "@/components/icons";

import { useIsMobile } from "@/hooks/use_is_mobile";
import { ROUTES } from "@/constants";
import { ProfileMenu } from "@/components/profile_menu";
import { useAuthentication } from "@/features/auth/auth_context";
import { AddPositionMenu } from "@/features/dashboard/add_position_menu";
import { Branding } from "@/components/branding";
import { NotificationsInbox } from "@/components/notification/notification_inbox";

const SIDEBAR_ROUTES = [
    ROUTES.dashboard,
    ROUTES.listPositions,
    ROUTES.newPositions,
    ROUTES.importPositions,
    ROUTES.calendar,
];

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

    const { data: unreadCountData } = useNotificationsUnreadCount();
    const unreadCount = unreadCountData?.unread_count ?? 0;

    const notificationUnreadCountDot = <div className="bg-accent text-foreground flex-center size-2 rounded-full" />;

    return (
        <div
            className={cn("relative flex h-full flex-col justify-between px-3", {
                "w-[220px]!": isOpen && !isMobile,
                hidden: !isOpen && isMobile,
            })}
        >
            <div className="mt-6 flex flex-col gap-y-2 pb-2">
                <div className="mb-4">
                    <Branding size="small" hideText={!isOpen || isMobile} hideBetaTag />
                </div>

                <AddPositionMenu sidebarOpen={isOpen} />

                <div className="h-12" />

                <Link to={ROUTES.dashboard} variant="unstyled">
                    <SidebarItem
                        label="Dashboard"
                        icon={<IconDashboard size={20} />}
                        open={isOpen}
                        isActive={activeRoute === ROUTES.dashboard}
                        onClick={() => handleClick(ROUTES.dashboard)}
                    />
                </Link>

                <Link to={ROUTES.listPositions} variant="unstyled">
                    <SidebarItem
                        label="Positions"
                        icon={<IconCandlestick size={20} />}
                        open={isOpen}
                        isActive={activeRoute === ROUTES.listPositions}
                        onClick={() => handleClick(ROUTES.listPositions)}
                    />
                </Link>

                <Link to={ROUTES.calendar} variant="unstyled">
                    <SidebarItem
                        label="Calendar"
                        icon={<IconCalendarSingle size={20} />}
                        open={isOpen}
                        isActive={activeRoute === ROUTES.calendar}
                        onClick={() => handleClick(ROUTES.calendar)}
                    />
                </Link>
            </div>

            <div className="mb-4 space-y-2">
                <Popover open={showNotifications} onOpenChange={setShowNotifications}>
                    <PopoverTrigger className="w-full" onClick={() => setShowNotifications((prev) => !prev)}>
                        <SidebarItem
                            label={
                                <span className="flex-x w-full justify-between">
                                    Notifications {isOpen && unreadCount > 0 && notificationUnreadCountDot}
                                </span>
                            }
                            icon={
                                <div className="relative">
                                    {(!isOpen || isMobile) && unreadCount > 0 && (
                                        <span
                                            className={cn({
                                                "absolute -top-0 -right-0": unreadCount > 0 && !isOpen,
                                            })}
                                        >
                                            {notificationUnreadCountDot}
                                        </span>
                                    )}
                                    <IconBell size={20} />
                                </div>
                            }
                            open={isOpen}
                            isActive={showNotifications}
                        />
                    </PopoverTrigger>

                    <PopoverContent
                        side="right"
                        align="end"
                        sideOffset={8}
                        className="h-120 w-[calc(100vw-72px)] max-w-110 p-0"
                    >
                        <NotificationsInbox closeNotifications={() => setShowNotifications(false)} />
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

interface SidebarItemProps {
    label: ReactNode;
    icon: ReactNode;
    open: boolean;
    isActive: boolean;
    onClick?: () => void;
    isMobile?: boolean;
}

const SidebarItem: FC<SidebarItemProps> = (props) => {
    const { label, icon, open, isActive, onClick } = props;
    const isMobile = useIsMobile();

    const content = (
        <div
            className={cn(
                "peer text-text-muted [&_svg]:text-text-muted hover:[&_svg]:text-text-primary w-full rounded-sm bg-transparent p-2 text-sm! transition-colors",
                {
                    "bg-secondary-hover text-text-primary": isActive,
                    "hover:bg-secondary-hover hover:text-text-primary": !isActive,
                    "flex items-center gap-2 text-base": open && !isMobile,
                    "mx-auto flex h-9 w-9 items-center justify-center": !open || isMobile,
                }
            )}
            onClick={onClick}
        >
            {icon}
            {open && !isMobile && label}
        </div>
    );

    return (
        <Tooltip content={label} delayDuration={0} contentProps={{ side: "right" }} disabled={open}>
            {content}
        </Tooltip>
    );
};
