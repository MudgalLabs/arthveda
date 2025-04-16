import { FC, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { IconType } from "react-icons";

import { MdGridView as IconDashboard } from "react-icons/md";
import { TbChartCandle as IconTrades } from "react-icons/tb";
import { LuNotebookPen as IconJournal } from "react-icons/lu";
import { FaCircleChevronRight as IconRight } from "react-icons/fa6";
import { FaCircleChevronLeft as IconLeft } from "react-icons/fa6";

import { Logo } from "@/components/logo";
import { Tooltip } from "@/components/tooltip";
import {
    cn,
    loadFromLocalStorage,
    LocalStorageKey,
    saveToLocalStorage,
} from "@/lib/utils";
import { ROUTES } from "@/routes";
import { Branding } from "./branding";

export const Sidebar = () => {
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
        <div className="bg-background-2 relative flex h-dvh flex-col px-3">
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
                    {open ? <Branding height={48} /> : <Logo height={32} />}
                </div>

                <div className="mt-12 flex flex-col items-center gap-y-2">
                    <Link to={ROUTES.dashboard}>
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
                "flex w-[240px] gap-3": open,
            })}
            onClick={onClick}
        >
            <Icon size={24} />
            {open && <p>{label}</p>}
        </div>
    );

    if (open) {
        return content;
    }

    return (
        <Tooltip
            content={label}
            delayDuration={0}
            contentProps={{ side: "right" }}
        >
            {content}
        </Tooltip>
    );
};
