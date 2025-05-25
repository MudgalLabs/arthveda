import { FC, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Tooltip } from "@/s8ly/tooltip/tooltip";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/routes";
import { Link } from "@/components/link";
import {
    IconDashboard,
    IconExpandUpDown,
    IconLogout,
    IconSettings,
    IconTrades,
    IconType,
} from "@/components/icons";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@/s8ly/dropdown_menu/dropdown_menu";
import { useAuthentication } from "@/features/auth/auth_context";
import { useQueryClient } from "@tanstack/react-query";
import { apiHooks } from "@/hooks/api_hooks";
import { toast } from "@/components/toast";
import { useSidebar } from "@/components/sidebar/sidebar_context";
import { apiErrorHandler } from "@/lib/api";

const sidebarRoutes = [ROUTES.dashboard, ROUTES.positionList];

export const Sidebar = () => {
    const { data } = useAuthentication();
    const { pathname } = useLocation();
    const { isOpen } = useSidebar();

    const [activeRoute, setActiveRoute] = useState("");
    useEffect(() => {
        setActiveRoute(sidebarRoutes.includes(pathname) ? pathname : "");
    }, [pathname]);

    const navigate = useNavigate();

    const handleClick = (route: string) => {
        navigate(route);
        setActiveRoute(route);
    };

    return (
        <div
            className={cn(
                "bg-background border-r-accent-muted relative flex h-full flex-col justify-between border-r-1 px-3",
                {
                    "min-w-[280px]!": isOpen,
                    "min-w-fit": !isOpen,
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

                    <Link to={ROUTES.positionList} variant="unstyled">
                        <SidebarNavItem
                            label="Positions"
                            Icon={IconTrades}
                            open={isOpen}
                            isActive={activeRoute === ROUTES.positionList}
                            onClick={() => handleClick(ROUTES.positionList)}
                        />
                    </Link>
                </div>
            </div>

            <div
                className={cn("flex flex-col gap-y-2 pb-2", {
                    "items-center": !isOpen,
                })}
            >
                <SidebarProfileMenu
                    sidebarOpen={isOpen}
                    setActiveRoute={setActiveRoute}
                    email={data!.email}
                    displayName={data?.display_name}
                    profileImageURL={data?.display_image}
                />
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
}

const SidebarNavItem: FC<SidebarNavItemProps> = (props) => {
    const { label, Icon, open, isActive, onClick } = props;

    const content = (
        <div
            className={cn(
                "bg-background text-foreground-muted w-full rounded-md border-l-[3px] border-transparent p-3",
                {
                    "bg-accent-muted text-foreground border-l-primary border-l-[3px]":
                        isActive,
                    "hover:bg-muted hover:text-muted-foreground hover:cursor-pointer":
                        !isActive,
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
        <Tooltip
            content={label}
            delayDuration={0}
            contentProps={{ side: "right" }}
            disabled={open}
        >
            {content}
        </Tooltip>
    );
};

interface SidebarProfileProps {
    // Extra data is shown when `expanded` is `true`.
    expanded: boolean;

    // Can user click on this component?
    clickable: boolean;

    // Menu gets toggled when user clicks on this component.
    menuOpen: boolean;

    // User's email.
    email: string;

    // User's profile image URL.
    profileImageURL: string;

    // User's display name.
    displayName: string;

    // Style the component with classes.
    className?: string;
}

const SidebarProfile: FC<SidebarProfileProps> = (props) => {
    const {
        expanded,
        menuOpen,
        email,
        profileImageURL,
        displayName,
        clickable,
        className,
    } = props;

    return (
        <div
            className={cn(
                "text-foreground flex gap-x-2 rounded-md text-left transition-colors",
                {
                    "bg-muted text-foreground px-2 py-2": clickable,
                    "hover:bg-accent-muted hover:text-foreground hover:cursor-pointer":
                        clickable,
                    "bg-accent text-foreground": menuOpen,
                },
                className
            )}
        >
            {profileImageURL ? (
                <img className="h-10 rounded-sm" src={profileImageURL} />
            ) : (
                <DefaultProfileAvatar height={40} />
            )}

            {expanded && (
                <div className="flex w-full items-center justify-between">
                    <div>
                        <p className="text-sm">{displayName}</p>
                        <p className="text-[12px]">{email}</p>
                    </div>

                    {clickable && <IconExpandUpDown size={18} className="" />}
                </div>
            )}
        </div>
    );
};

interface SidebarProfileMenuProps {
    sidebarOpen: boolean;
    setActiveRoute: (route: string) => void;
    email: string;
    profileImageURL?: string;
    displayName?: string;
}

const SidebarProfileMenu: FC<SidebarProfileMenuProps> = (props) => {
    const {
        sidebarOpen,
        setActiveRoute,
        email,
        displayName = "Set Your Name",
        profileImageURL = "",
    } = props;

    const [menuOpened, setMenuOpened] = useState(false);

    const navigate = useNavigate();
    const client = useQueryClient();

    const { mutate: signout, isPending: isSignoutPending } =
        apiHooks.auth.useSignout({
            onSuccess: async () => {
                // NOTE: Make sure to await otherwise the screen will flicker.
                await client.invalidateQueries();
                navigate("/");
                toast.info("Goodbye. Thank you for using Arthveda.", {
                    icon: <p>👋</p>,
                });
            },
            onError: apiErrorHandler,
        });

    return (
        <DropdownMenu open={menuOpened} onOpenChange={setMenuOpened}>
            <DropdownMenuTrigger onClick={() => setMenuOpened((prev) => !prev)}>
                <SidebarProfile
                    email={email}
                    profileImageURL={profileImageURL}
                    displayName={displayName}
                    menuOpen={menuOpened}
                    expanded={sidebarOpen}
                    clickable={true}
                />
            </DropdownMenuTrigger>

            <DropdownMenuContent
                side="right"
                align="end"
                className="min-w-[240px]"
            >
                <DropdownMenuItem
                    className="cursor-default hover:bg-inherit"
                    disabled
                >
                    <SidebarProfile
                        email={email}
                        profileImageURL={profileImageURL}
                        displayName={displayName}
                        menuOpen={false}
                        expanded
                        clickable={false}
                    />
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <Link to={ROUTES.settings} variant="unstyled">
                    <DropdownMenuItem
                        onClick={() => setActiveRoute(ROUTES.settings)}
                    >
                        <IconSettings size={18} />
                        Settings
                    </DropdownMenuItem>
                </Link>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    className={cn({
                        "cursor-not-allowed hover:bg-none": isSignoutPending,
                    })}
                    onSelect={() => signout()}
                    disabled={isSignoutPending}
                >
                    <IconLogout size={18} />
                    Sign out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

interface DefaultProfieAvatarProps {
    height?: number;
}

const DefaultProfileAvatar: FC<DefaultProfieAvatarProps> = (props) => {
    const { height = 40 } = props;

    return (
        <svg height={height} viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="5.71429" fill="#EFFAFF" />
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M13.5713 14.2857C13.5713 10.7353 16.4495 7.85712 19.9999 7.85712C23.5503 7.85712 26.4285 10.7353 26.4285 14.2857C26.4285 17.8361 23.5503 20.7143 19.9999 20.7143C16.4495 20.7143 13.5713 17.8361 13.5713 14.2857Z"
                fill="#0072AB"
            />
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M8.21598 34.4362C8.32647 28.0222 13.5599 22.8571 19.9999 22.8571C26.4401 22.8571 31.6736 28.0225 31.7839 34.4366C31.7912 34.862 31.5461 35.2514 31.1594 35.4288C27.7609 36.9883 23.9807 37.8571 20.0004 37.8571C16.0197 37.8571 12.2391 36.9881 8.84037 35.4284C8.4537 35.251 8.20865 34.8615 8.21598 34.4362Z"
                fill="#0072AB"
            />
        </svg>
    );
};
