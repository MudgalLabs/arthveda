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
    IconRight,
    IconTrades,
    IconType,
} from "@/components/icons";
import { useAuthentication } from "@/context/authentication-context";

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
                        >
                            <div className="flex items-center gap-x-2">
                                <IconAdd size={24} /> {open && "Add Trade"}
                            </div>
                        </Button>
                    </Tooltip>
                </Link>

                <SidebarProfile open={open} email={userEmail} />
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
}

const SidebarProfile: FC<SidebarProfileProps> = (props) => {
    const { open, email, avatarURL } = props;

    return (
        <div
            className={cn(
                "text-foreground-2 hover:bg-primary-950 active:bg-primary-900 flex gap-x-2 rounded-lg hover:cursor-pointer",
                {
                    "px-3 py-2": open,
                }
            )}
        >
            {avatarURL ? (
                <img src={avatarURL} />
            ) : (
                <DefaultProfileAvatar height={open ? 40 : 48} />
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
    );
};

interface DefaultProfieAvatarProps {
    height?: number;
}

const DefaultProfileAvatar: FC<DefaultProfieAvatarProps> = (props) => {
    const { height = 40 } = props;

    return (
        <svg
            height={height}
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
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
