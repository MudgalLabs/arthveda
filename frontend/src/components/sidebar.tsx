import { FC, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { IconType } from "react-icons";

import { MdGridView as IconDashboard } from "react-icons/md";
import { TbChartCandle as IconTrades } from "react-icons/tb";
import { LuNotebookPen as IconJournal } from "react-icons/lu";
import { FaCircleChevronRight as IconRight } from "react-icons/fa6";
import { FaCircleChevronLeft as IconLeft } from "react-icons/fa6";

import { Logo } from "@/components/logo";
import { Tooltip } from "@/components/tooltip";
import { cn } from "@/lib/utils";
import { APP_ROUTES } from "@/app-routes";

export const Sidebar = () => {
    const [open, setOpen] = useState(false);

    const { pathname } = useLocation();
    const navigate = useNavigate();

    return (
        <div className="relative flex h-dvh flex-col px-3">
            <div>
                <div
                    className={cn(
                        "mt-6 flex w-full items-center justify-center",
                        {
                            "gap-3": open,
                        }
                    )}
                >
                    <Logo height={32} />
                    <p
                        className={cn("hidden", {
                            "font-poppins text-primary-500 inline-block items-center text-2xl font-bold":
                                open,
                        })}
                    >
                        Arthveda
                    </p>
                </div>

                <div className="absolute top-17 right-[-9px] opacity-50 transition-opacity hover:opacity-100">
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

                <div className="mt-12 flex flex-col items-center gap-y-2">
                    <SidebarNavItem
                        label="Dashboard"
                        Icon={IconDashboard}
                        open={open}
                        isActive={pathname === APP_ROUTES.dashboard}
                        onClick={() => navigate(APP_ROUTES.dashboard)}
                    />
                    <SidebarNavItem
                        label="Trades"
                        Icon={IconTrades}
                        open={open}
                        isActive={pathname === APP_ROUTES.trades}
                        onClick={() => navigate(APP_ROUTES.trades)}
                    />
                    <SidebarNavItem
                        label="Journal"
                        Icon={IconJournal}
                        open={open}
                        isActive={pathname === APP_ROUTES.journal}
                        onClick={() => navigate(APP_ROUTES.journal)}
                    />
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
