import { FC, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Logo } from "@/components/logo";
import { Tooltip } from "@/components/tooltip";
import {
    cn,
    loadFromLocalStorage,
    LocalStorageKey,
    saveToLocalStorage,
} from "@/lib/utils";
import { ROUTES } from "@/routes";
import { Branding } from "@/components/branding";
import { Link } from "@/components/link";
import { Button } from "@/s8ly";
import {
    IconAdd,
    IconDashboard,
    IconExpandUpDown,
    IconJournal,
    IconLeft,
    IconLogout,
    IconRight,
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
} from "@/components/dropdown-menu";
import { useAuthentication } from "@/context/authentication-context";
import { useQueryClient } from "@tanstack/react-query";
import { apiHooks } from "@/hooks/api-hooks";
import { toast } from "@/components/toast";

export const Sidebar = () => {
    const { userEmail } = useAuthentication();

    const { pathname } = useLocation();

    const [open, setOpen] = useState<boolean>(
        JSON.parse(
            loadFromLocalStorage(LocalStorageKey.SIDEBAR_OPEN) || "false"
        )
    );

    const [activeRoute, setActiveRoute] = useState(pathname);

    const navigate = useNavigate();

    const handleClick = (route: string) => {
        navigate(route);
        setActiveRoute(route);
    };

    useEffect(() => {
        saveToLocalStorage(LocalStorageKey.SIDEBAR_OPEN, JSON.stringify(open));
    }, [open]);

    return (
        <div className="bg-background-2 relative flex h-dvh flex-col justify-between px-3">
            <div>
                <div className="absolute top-4 right-[-9px] opacity-50 transition-opacity hover:opacity-100">
                    <button
                        className="text-primary-400 cursor-pointer"
                        onClick={() => setOpen((prev) => !prev)}
                    >
                        {open ? (
                            <Tooltip
                                content="Collapse"
                                delayDuration={300}
                                contentProps={{ side: "left" }}
                            >
                                <IconLeft size={20} />
                            </Tooltip>
                        ) : (
                            <Tooltip
                                content="Expand"
                                delayDuration={300}
                                contentProps={{ side: "right" }}
                            >
                                <IconRight size={20} />
                            </Tooltip>
                        )}
                    </button>
                </div>

                <div
                    className={cn(
                        "mt-12 flex w-full items-center justify-center"
                    )}
                >
                    {open ? (
                        // FIXME
                        // The negative mt is a hack to make the Logo and Branding Logo appear at the same height.
                        // This can be fixed by removing the padding from SVG by re-rendering a new one from Figma.
                        <Branding height={32} className="" />
                    ) : (
                        <Logo height={32} />
                    )}
                </div>

                <div className="mt-12 flex flex-col items-center gap-y-2">
                    <Link to={ROUTES.dashboard} unstyled>
                        <SidebarNavItem
                            label="Dashboard"
                            Icon={IconDashboard}
                            open={open}
                            isActive={activeRoute === ROUTES.dashboard}
                            onClick={() => handleClick(ROUTES.dashboard)}
                        />
                    </Link>

                    <Link to={ROUTES.trades}>
                        <SidebarNavItem
                            label="Trades"
                            Icon={IconTrades}
                            open={open}
                            isActive={activeRoute === ROUTES.trades}
                            onClick={() => handleClick(ROUTES.trades)}
                        />
                    </Link>

                    <Link to={ROUTES.journal}>
                        <SidebarNavItem
                            label="Journal"
                            Icon={IconJournal}
                            open={open}
                            isActive={activeRoute === ROUTES.journal}
                            onClick={() => handleClick(ROUTES.journal)}
                        />
                    </Link>
                </div>
            </div>

            <div
                className={cn("flex flex-col gap-y-2 pb-2", {
                    "items-center": !open,
                    "pb-4": !open,
                })}
            >
                <Link to={ROUTES.addTrade}>
                    <Tooltip
                        content="Add Trade"
                        delayDuration={0}
                        contentProps={{ side: "right" }}
                        disabled={open}
                    >
                        <Button
                            variant="secondary"
                            className={cn({
                                "w-full": open,
                                "p-3": !open,
                            })}
                            onClick={() => setActiveRoute(ROUTES.addTrade)}
                        >
                            <div className="flex items-center gap-x-2">
                                <IconAdd size={20} /> {open && "Add Trade"}
                            </div>
                        </Button>
                    </Tooltip>
                </Link>

                <SidebarProfile
                    open={open}
                    email={userEmail}
                    setActiveRoute={setActiveRoute}
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
            className={cn("text-primary-600 w-fit rounded-lg p-3", {
                "bg-primary-900 text-primary-100": isActive,
                "hover:bg-primary-950 active:bg-primary-900 active:text-primary-400 hover:cursor-pointer":
                    !isActive,
                "flex w-[240px] items-center gap-3 text-base": open,
            })}
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
    open: boolean;

    email: string;
    avatarURL?: string;
    fullName?: string;
    setActiveRoute: (route: string) => void;
}

const SidebarProfile: FC<SidebarProfileProps> = (props) => {
    const { open, email, avatarURL, setActiveRoute } = props;

    const [menuOpened, setMenuOpened] = useState(false);

    const navigate = useNavigate();
    const client = useQueryClient();

    const { mutate: signout, isPending: isSignoutPending } =
        apiHooks.auth.useSignout({
            onSuccess: async () => {
                // NOTE: Make sure to await otherwise the screen will flicker.
                await client.invalidateQueries();
                navigate("/");
                toast("Goodbye. Thank you for using Arthveda.", {
                    icon: <p>👋</p>,
                });
            },
        });

    return (
        <DropdownMenu dir="rtl" open={menuOpened} onOpenChange={setMenuOpened}>
            <DropdownMenuTrigger
                className="outline-none"
                type="button"
                onClick={() => setMenuOpened((prev) => !prev)}
            >
                <div
                    className={cn(
                        "text-foreground-2 hover:bg-primary-950 active:bg-primary-900 flex gap-x-2 rounded-lg text-left hover:cursor-pointer",
                        {
                            "px-3 py-2": open,
                            "bg-primary-900": menuOpened,
                        }
                    )}
                >
                    {avatarURL ? (
                        <img src={avatarURL} />
                    ) : (
                        <DefaultProfileAvatar />
                    )}
                    {open && (
                        <div className="flex w-auto items-center">
                            <div>
                                <p className="text-sm">Shikhar Sharma</p>
                                <p className="text-[12px]">{email}</p>
                            </div>
                            <IconExpandUpDown size={18} className="ml-6" />
                        </div>
                    )}
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                side="right"
                align="end"
                className="bg-primary-950 min-w-[200px] rounded-sm p-1"
            >
                <Link to={ROUTES.settings} unstyled>
                    <DropdownMenuItem
                        className="hover:bg-primary-900 flex cursor-pointer items-center justify-end gap-x-3 rounded-sm p-1 outline-none"
                        onClick={() => setActiveRoute(ROUTES.addTrade)}
                    >
                        Settings
                        <IconSettings size={18} />
                    </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator className="bg-primary-800 my-1 h-px" />
                <DropdownMenuItem
                    className={cn(
                        "hover:bg-primary-900 flex cursor-pointer items-center justify-end gap-x-3 rounded-sm p-1 outline-none",
                        {
                            "cursor-not-allowed hover:bg-none":
                                isSignoutPending,
                        }
                    )}
                    onSelect={() => signout()}
                    disabled={isSignoutPending}
                >
                    Sign out
                    <IconLogout size={18} />
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
