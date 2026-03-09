import { Outlet } from "react-router-dom";
import { Button, useDocumentTitle } from "netra";

import { Branding } from "@/components/branding";
import { apiHooks } from "@/hooks/api_hooks";
import { apiErrorHandler } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

export default function Onboarding() {
    useDocumentTitle("Onboarding • Arthveda");

    const client = useQueryClient();

    const { mutate: signout, isPending: isSignoutPending } = apiHooks.auth.useSignout({
        onSuccess: async () => {
            // NOTE: Make sure to await otherwise the screen will flicker.
            await client.invalidateQueries();
        },
        onError: apiErrorHandler,
    });

    return (
        <div className="h-screen">
            <div className="flex-x justify-between p-4">
                <Branding hideBetaTag size="small" />

                <Button variant="ghost" onClick={() => signout()} disabled={isSignoutPending}>
                    Sign out
                </Button>
            </div>

            <Outlet />
        </div>
    );
}
