import { FC } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { IconType } from "react-icons";

import { MdGridView as IconDashboard } from "react-icons/md";
import { TbChartCandle as IconTrades } from "react-icons/tb";
import { LuNotebookPen as IconJournal } from "react-icons/lu";

import { Logo } from "@/components/logo";
import { Tooltip } from "@/components/tooltip";
import { cn } from "@/lib/utils";
import { APP_ROUTES } from "@/app-routes";

interface SidebarProps {
    open?: boolean;
}

export const Sidebar: FC<SidebarProps> = (props) => {
    const { open = false } = props;

    const { pathname } = useLocation();
    const navigate = useNavigate();

    return (
        <div className="flex h-dvh flex-col px-3">
            <div>
                <Logo className="m-auto mt-6" />

                <div className="mt-15 flex flex-col items-center gap-y-2">
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

    const icon = (
        <div
            className={cn(
                "text-primary-600 hover:bg-primary-950 active:bg-primary-900 active:text-primary-400 rounded-lg p-3 transition hover:cursor-pointer",
                {
                    "bg-primary-900 text-primary-50": isActive,
                }
            )}
            onClick={onClick}
        >
            <Icon size={24} />
        </div>
    );

    return (
        <Tooltip
            content={label}
            delayDuration={0}
            contentProps={{ side: "right" }}
        >
            {icon}
        </Tooltip>
    );
};
