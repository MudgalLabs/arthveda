import { FC, useState } from "react";
import { usePostHog } from "posthog-js/react";

import { Button } from "netra";
import {
    IconLogout,
    IconCreditCard,
    // IconLifeBuoy,
    IconPlug,
    IconChevronDown,
} from "@/components/icons";
import { Link } from "@/components/link";
import { ROUTES } from "@/constants";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/s8ly/dropdown_menu/dropdown_menu";
import { useQueryClient } from "@tanstack/react-query";
import { apiHooks } from "@/hooks/api_hooks";
import { toast } from "@/components/toast";
import { apiErrorHandler } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ProfileMenuProps {
    sidebarOpen: boolean;
    email: string;
    profileImageURL?: string;
    displayName?: string;
    isMobile?: boolean;
}

export const ProfileMenu: FC<ProfileMenuProps> = (props) => {
    const posthog = usePostHog();

    const { sidebarOpen, email, displayName = "", profileImageURL = "" } = props;

    const [open, setOpen] = useState(false);
    const [error, setError] = useState(false);

    const client = useQueryClient();

    const { mutate: signout, isPending: isSignoutPending } = apiHooks.auth.useSignout({
        onSuccess: async () => {
            posthog?.capture("User Signed Out");
            posthog?.reset();
            // NOTE: Make sure to await otherwise the screen will flicker.
            await client.invalidateQueries();
            toast.info("Goodbye! Thank you for using Arthveda", {
                icon: <p>👋</p>,
            });
        },
        onError: apiErrorHandler,
    });

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className={cn("flex h-auto w-fit items-start justify-between p-1 enabled:active:scale-[1]!", {
                        "bg-secondary-hover text-text-primary": open,
                        "flex-center": sidebarOpen,
                    })}
                >
                    {!error && profileImageURL ? (
                        <img
                            className="rounded-sm p-0"
                            height={28}
                            width={28}
                            src={profileImageURL}
                            onError={() => setError(true)}
                        />
                    ) : (
                        <DefaultProfileAvatar height={28} />
                    )}

                    {sidebarOpen && <IconChevronDown size={16} />}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent side="bottom" align="start" className="mt-1 min-w-[240px]">
                <DropdownMenuLabel>
                    <div className="flex-x">
                        <div>
                            {!error && profileImageURL ? (
                                <img
                                    className="rounded-sm"
                                    height={40}
                                    width={40}
                                    src={profileImageURL}
                                    onError={() => setError(true)}
                                />
                            ) : (
                                <DefaultProfileAvatar height={36} />
                            )}
                        </div>
                        <div>
                            <p className="text-sm font-normal">{displayName}</p>
                            <p className="label-muted text-xs">{email}</p>
                        </div>
                    </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <Link to={ROUTES.subscription} variant="unstyled">
                    <DropdownMenuItem>
                        <IconCreditCard size={18} />
                        Subscription
                    </DropdownMenuItem>
                </Link>

                <Link to={ROUTES.brokerAccounts} variant="unstyled">
                    <DropdownMenuItem>
                        <IconPlug size={18} />
                        Broker Accounts
                    </DropdownMenuItem>
                </Link>

                {/* <Link to={ROUTES.feedbackAndSupport} variant="unstyled">
                    <DropdownMenuItem>
                        <IconLifeBuoy size={18} />
                        Feedback & Support
                    </DropdownMenuItem>
                </Link> */}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    className={cn({
                        "hover:bg-none": isSignoutPending,
                    })}
                    onSelect={() => signout()}
                    disabled={isSignoutPending}
                >
                    <IconLogout size={18} />
                    Sign Out
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
